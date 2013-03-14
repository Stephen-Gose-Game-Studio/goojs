/* jshint bitwise: false */

define([
		'goo/entities/Entity',
		'goo/renderer/Camera',
		'goo/entities/components/CameraComponent',
		'goo/entities/components/TransformComponent',
		'goo/entities/components/MeshRendererComponent',
		'goo/entities/components/MeshDataComponent',
		'goo/renderer/MeshData',
		'goo/math/Vector3',

		'goo/lib/rsvp.amd',

		'goo/loaders/MaterialLoader',
		'goo/loaders/MeshLoader',
		'goo/loaders/Loader'
	],
/** @lends EntityLoader */
function(
		Entity,
		Camera,
		CameraComponent,
		TransformComponent,
		MeshRendererComponent,
		MeshDataComponent,
		MeshData,
		Vector3,

		RSVP,

		MaterialLoader,
		MeshLoader,
		Loader
	) {
	"use strict";

	/**
	 * Utility class for loading an entities into a World.
	 *
	 * @constructor
	 * @param {World} parameters.world The target World object.
	 * @param {Loader} parameters.loader
	 */
	function EntityLoader(parameters) {
		if(typeof parameters === "undefined" || parameters === null) {
			throw new Error('EntityLoader(): Argument `parameters` was undefined/null');
		}

		if(typeof parameters.loader === "undefined" || !(parameters.loader instanceof Loader) || parameters.loader === null) {
			throw new Error('EntityLoader(): Argument `parameters.loader` was invalid/undefined/null');
		}

		if(typeof parameters.world === "undefined" || parameters.world === null) {
			throw new Error('EntityLoader(): Argument `parameters.world` was undefined/null');
		}

		this._loader = parameters.loader;
		this._world = parameters.world;

		this._cache = {};
		this._materialLoader = new MaterialLoader({ loader: this._loader });
		this._meshLoader = new MeshLoader({ loader: this._loader });
	}

	/**
	 * Loads the entity at <code>entityPath</code>.
	 *
	 * @param {string} entityPath Relative path to the entity.
	 * @return {Promise} The promise is resolved with the loaded Entity object.
	 */
	EntityLoader.prototype.load = function(entityRef) {
		var that = this;
		var promise = this._loader.load(entityRef+'.json', function(data) {
			return that._parse(data, entityRef);
		});
		this._cache[entityRef] = promise;
		return promise;
	};


	EntityLoader.prototype._parse = function(entitySource) {
		var promises = []; // Keep track of promises
		var loadedComponents = []; // Array containing loaded components
		var that = this;

		if(entitySource.components) {
			var component;

			component = entitySource.components.transform;
			if(component) {
				loadedComponents.push(this._getTransformComponent(component));
			}

			component = entitySource.components.camera;
			if(component) {
				loadedComponents.push(this._getCameraComponent(component));

			}

			component = entitySource.components.meshRenderer;
			if(component) {
				var p = this._getMeshRendererComponent(component)
				.then(function(meshRendererComponent) {
					loadedComponents.push(meshRendererComponent);
					return meshRendererComponent;
				});

				promises.push(p);
			}

			component = entitySource.components.meshData;
			if(component) {
				var p = this._getMeshDataComponent(component)
				.then(function(meshDataComponent) {
					loadedComponents.push(meshDataComponent);
					return meshDataComponent;
				});

				promises.push(p);
			}
		}

		if(loadedComponents.length === 0 && promises.length === 0) {
			var p = new RSVP.Promise();
			p.reject('Entity definition `' + entitySource + '` does not seem to contain any components.');
			return p;
		}

		// When all promises are processed we want to
		// either create an entity or return an error
		return RSVP.all(promises)
		.then(function() {
			var entity = new Entity(that._world, entitySource.name);
			for(var i in loadedComponents) {
				if(loadedComponents[i].type === 'TransformComponent') {
					entity.clearComponent('transformComponent');
				}
				entity.setComponent(loadedComponents[i]);
			}

			if (entity.meshDataComponent
			&& entity.meshDataComponent.meshData.type === MeshData.SKINMESH
			&& entity.meshRendererComponent
			&& entity.meshRendererComponent.materials.length) {
				var materials = entity.meshRendererComponent.materials;
				for (var defines, i = 0, max = materials.length; i < max; i++) {
					defines = materials[i].shader.defines;
					if (defines && defines.JOINT_COUNT !== undefined
					&& defines.WEIGHTS !== undefined) {
						defines.JOINT_COUNT = entity.meshDataComponent.meshData.paletteMap.length;
						defines.WEIGHTS = entity.meshDataComponent.meshData.weightsPerVertex;
					}
				}
			}
			return entity;
		});
	};

	EntityLoader.prototype._getTransformComponent = function(transformComponentSource) {
		// Create a transform
		var tc = new TransformComponent();

		tc.transform.translation = new Vector3(transformComponentSource.translation);
		tc.transform.scale = new Vector3(transformComponentSource.scale);

		tc.transform.rotation.fromAngles(
			transformComponentSource.rotation[0],
			transformComponentSource.rotation[1],
			transformComponentSource.rotation[2]
		);

		var p = transformComponentSource.parentRef;
		if(p && this._cache[p]) {
			this._cache[p].then(function(entity) {
				entity.transformComponent.attachChild(tc);
				return entity;
			});
		}

		return tc;
	};

	EntityLoader.prototype._getCameraComponent = function(cameraComponentSource) {
		// Create a camera
		var cam = new Camera(
			cameraComponentSource.fov || 45,
			cameraComponentSource.aspect || 1,
			cameraComponentSource.near || 1,
			cameraComponentSource.far || 100);

		return new CameraComponent(cam);
	};

	EntityLoader.prototype._getMeshRendererComponent = function(meshRendererComponentSource) {
		var promises = [];
		var ml = this._materialLoader;

		for(var attribute in meshRendererComponentSource) {
			if(attribute === 'materials') {
				for(var i in meshRendererComponentSource[attribute]) {
					var p = ml.load(meshRendererComponentSource[attribute][i]);
					promises.push(p);
				}
			}
		}

		return RSVP.all(promises)
		.then(function(materials) {
			var mrc = new MeshRendererComponent();
			for(var i in materials) {
				mrc.materials.push(materials[i]);
			}
			return mrc;
		});
	};


	EntityLoader.prototype._getMeshDataComponent = function(meshDataComponentSource) {
		var promises = [];
		var mdl = this._meshLoader;
		for(var attribute in meshDataComponentSource) {
			// var meshDataPromises = [];
			if(attribute === 'mesh') {
				var p = mdl.load(meshDataComponentSource[attribute]);
				promises.push(p);
			}
		}

		// When the mesh is loaded
		return RSVP.all(promises)
		.then(function(data) {
			// We placed the meshDataPromise first so it's at index 0
			var mdc = new MeshDataComponent(data[0]);

			return mdc;
		});
	};


	return EntityLoader;
});