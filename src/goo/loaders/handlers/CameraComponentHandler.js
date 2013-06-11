// Generated by CoffeeScript 1.4.0
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

define(['goo/loaders/handlers/ComponentHandler', 'goo/entities/components/CameraComponent', 'goo/renderer/Camera', 'goo/util/rsvp', 'goo/util/PromiseUtil', 'goo/util/ObjectUtil'], function(ComponentHandler, CameraComponent, Camera, RSVP, pu, _) {
  var CameraComponentHandler;
  return CameraComponentHandler = (function(_super) {

    __extends(CameraComponentHandler, _super);

    function CameraComponentHandler() {
      return CameraComponentHandler.__super__.constructor.apply(this, arguments);
    }

    CameraComponentHandler._register('camera');

    CameraComponentHandler.prototype._prepare = function(config) {
      return _.defaults(config, {
        fov: 45,
        near: 1,
        far: 10000
      });
    };

    CameraComponentHandler.prototype._create = function(entity, config) {
      var camera, component;
      camera = new Camera(45, 1, 1, 1000);
      component = new CameraComponent(camera);
      entity.setComponent(component);
      return component;
    };

    CameraComponentHandler.prototype.update = function(entity, config) {
      var component;
      component = CameraComponentHandler.__super__.update.call(this, entity, config);
      component.camera.setFrustumPerspective(config.fov, void 0, config.near, config.far);
      return pu.dummyPromise(component);
    };

    CameraComponentHandler.prototype.remove = function(entity) {
      var _ref;
      if (entity != null ? (_ref = entity.cameraComponent) != null ? _ref.camera : void 0 : void 0) {
        this.world.removeEntity(entity.cameraComponent.camera);
      }
      return CameraComponentHandler.__super__.remove.call(this, entity);
    };

    return CameraComponentHandler;

  })(ComponentHandler);
});
