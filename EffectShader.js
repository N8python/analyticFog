import * as THREE from 'https://cdn.skypack.dev/three@0.150.0';
const EffectShader = {

    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'projectionMatrixInv': { value: new THREE.Matrix4() },
        'viewMatrixInv': { value: new THREE.Matrix4() },
        'cameraPos': { value: new THREE.Vector3() },
        "fogNormal": { value: new THREE.Vector3(0, 1, 0) },
        "fogOffset": { value: 0 }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform highp sampler2D sceneDiffuse;
    uniform highp sampler2D sceneDepth;
    uniform mat4 projectionMatrixInv;
    uniform mat4 viewMatrixInv;
    uniform vec3 cameraPos;
    uniform vec3 fogNormal;
    uniform float fogOffset;
        varying vec2 vUv;
        vec3 getWorldPos(float depth, vec2 coord) {
          float z = depth * 2.0 - 1.0;
          vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
          vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
          // Perspective division
          viewSpacePosition /= viewSpacePosition.w;
          vec4 worldSpacePosition = viewMatrixInv * viewSpacePosition;
          return worldSpacePosition.xyz;
      }
      #include <common>
      #include <dithering_pars_fragment>
		void main() {
            vec4 diffuse = texture2D(sceneDiffuse, vUv);
            float depth = texture2D(sceneDepth, vUv).x;
            vec3 worldPos = getWorldPos(depth, vUv);
            vec3 rayDir = normalize(worldPos - cameraPos);
            if (depth == 1.0) {
              worldPos = cameraPos + rayDir * 1e6;
            }
            worldPos += fogNormal * -fogOffset;
            vec3 offsetCameraPos = cameraPos + fogNormal * -fogOffset;
            const float a = 0.025;
            const float b = 0.1;
            float camStartAlongPlane = dot(offsetCameraPos, fogNormal);
            float rayAlongPlane = dot(rayDir, fogNormal);
            float fogAmount =  (a/b) * max(abs(exp(-camStartAlongPlane*b)), 1e-20) * (1.0-exp( -distance(cameraPos, worldPos)*rayAlongPlane*b ))/rayAlongPlane;
            diffuse.rgb = mix(diffuse.rgb, vec3(0.5,0.6,0.7), 1.0 - exp(-fogAmount));
            gl_FragColor = vec4(
              diffuse.rgb, 1.0);
            #include <dithering_fragment>
		}`

};

export { EffectShader };