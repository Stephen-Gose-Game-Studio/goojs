define([
	'goo/scripts/Scripts',
	'goo/scripts/newwave/WASDScript',
	'goo/scripts/newwave/MouseLookScript'
], function(
	Scripts,
	WASDScript,
	MouseLookScript
) {
	'use strict';


	function FlyControlScript() {
		var wasdScript = Scripts.create('WASD');
		var lookScript = Scripts.create('MouseLookScript');
		function setup(parameters, environment) {
			lookScript.setup(parameters, environment);
			wasdScript.setup(parameters, environment);
		}
		function update(parameters, environment) {
			lookScript.update(parameters, environment);
			wasdScript.update(parameters, environment);
		}
		function cleanup(parameters, environment) {
			lookScript.cleanup(parameters, environment);
			wasdScript.cleanup(parameters, environment);
		}

		return {
			setup: setup,
			cleanup: cleanup,
			update: update
		};
	}

	var wasdParams = WASDScript.externals.parameters;
	var mouseLookParams = MouseLookScript.externals.parameters;

	FlyControlScript.externals = {
		name: 'FlyControlScript',
		description: 'This is a combo of WASDscript and mouselookscript',
		parameters: wasdParams.concat(mouseLookParams)
	};

	return FlyControlScript;
});