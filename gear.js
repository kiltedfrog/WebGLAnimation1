/*
Used gears Mathew, brendel, osborne, and perez.
I made a few color changes to some that didn't have color parameters.


*/

main();


function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl', {antialias: true}  );

  // If we don't have a GL context, give up now
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }


  var angle_x = 0;
  var angle_y = 0;
  var angle_z = 0;
  var tIncr = 0.001;

  // Vertex shader program, runs on GPU, once per vertex

  const vsSource = `
  // Vertex Shader
  precision mediump int;
  precision mediump float;

  // Scene transformations
  uniform mat4 u_PVM_transform; // Projection, view, model transform
  uniform mat4 u_VM_transform;  // View, model transform

  // Light model
  uniform vec3 u_Light_position;
  uniform vec3 u_Light_color;
  uniform float u_Shininess;
  uniform float u_Fade;
  uniform vec3 u_Ambient_color;

  // Original model data
  attribute vec3 a_Vertex;
  attribute vec3 a_Color;
  attribute vec3 a_Vertex_normal;

  // Data (to be interpolated) that is passed on to the fragment shader
  varying vec3 v_Vertex;
  varying vec4 v_Color;
  varying vec3 v_Normal;

  void main() {

    // Perform the model and view transformations on the vertex and pass this
    // location to the fragment shader.
    v_Vertex = vec3( u_VM_transform * vec4(a_Vertex, 1.0) );

    // Perform the model and view transformations on the vertex's normal vector
    // and pass this normal vector to the fragment shader.
    v_Normal = vec3( u_VM_transform * vec4(a_Vertex_normal, 0.0) );

    // Pass the vertex's color to the fragment shader.
    v_Color = vec4(a_Color, 1.0);

    // Transform the location of the vertex for the rest of the graphics pipeline
    gl_Position = u_PVM_transform * vec4(a_Vertex, 1.0);

  }
  `;

  // Fragment shader program, runs on GPU, once per potential pixel

  const fsSource = `
  // Fragment shader program
  precision mediump int;
  precision mediump float;

  // Light model
  uniform vec3 u_Light_position;
  uniform vec3 u_Light_color;
  uniform float u_Shininess;
  uniform float u_Fade;
  uniform vec3 u_Ambient_color;

  // Data coming from the vertex shader
  varying vec3 v_Vertex;
  varying vec4 v_Color;
  varying vec3 v_Normal;

  void main() {

    vec3 to_light;
    vec3 vertex_normal;
    vec3 reflection;
    vec3 to_camera;
    float cos_angle;
	float fade;
    vec3 diffuse_color;
    vec3 specular_color;
    vec3 ambient_color;
    vec3 color;

	fade = u_Fade;
    // Calculate the ambient color as a percentage of the surface color
    ambient_color = u_Ambient_color * vec3(v_Color);

    // Calculate a vector from the fragment location to the light source
    to_light = u_Light_position - v_Vertex;
    to_light = normalize( to_light );

    // The vertex's normal vector is being interpolated across the primitive
    // which can make it un-normalized. So normalize the vertex's normal vector.
    vertex_normal = normalize( v_Normal );

    // Calculate the cosine of the angle between the vertex's normal vector
    // and the vector going to the light.
    cos_angle = dot(vertex_normal, to_light);
    cos_angle = clamp(cos_angle, 0.0, 1.0);

    // Scale the color of this fragment based on its angle to the light.
    diffuse_color = vec3(v_Color) * cos_angle;

    // Calculate the reflection vector
    reflection = 2.0 * dot(vertex_normal,to_light) * vertex_normal - to_light;

    // Calculate a vector from the fragment location to the camera.
    // The camera is at the origin, so negating the vertex location gives the vector
    to_camera = -1.0 * v_Vertex;

    // Calculate the cosine of the angle between the reflection vector
    // and the vector going to the camera.
    reflection = normalize( reflection );
    to_camera = normalize( to_camera );
    cos_angle = dot(reflection, to_camera);
    cos_angle = clamp(cos_angle, 0.0, 1.0);
    cos_angle = pow(cos_angle, u_Shininess);

    // The specular color is from the light source, not the object
    if (cos_angle > 0.0) {
      specular_color = u_Light_color * cos_angle;
      diffuse_color = diffuse_color * (1.0 - cos_angle);
    } else {
      specular_color = vec3(0.0, 0.0, 0.0);
    }

    color = (ambient_color + diffuse_color + specular_color)*fade;

    gl_FragColor = vec4(color, v_Color.a);
  }
  `;

  // Initialize a shader program; this is where all
  // the lighting for the objects, if any, is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Tell WebGL to use our program when drawing
  gl.useProgram(shaderProgram);

  // Collect all the info needed to use the shader program.
  // Look up locations of attributes and uniforms used by
  // our shader program
  const programInfo = {
    program: shaderProgram,
    locations: {
      a_vertex: gl.getAttribLocation(shaderProgram, 'a_Vertex'),
      a_color: gl.getAttribLocation(shaderProgram, 'a_Color'),
      a_normal: gl.getAttribLocation(shaderProgram, 'a_Vertex_normal'),
      u_light_dir: gl.getUniformLocation(shaderProgram, 'u_Light_position'),
	  u_light_color: gl.getUniformLocation(shaderProgram, 'u_Light_color'),
	  u_shininess: gl.getUniformLocation(shaderProgram, 'u_Shininess'),
	  u_fade: gl.getUniformLocation(shaderProgram, 'u_Fade'),
	  u_ambient_color: gl.getUniformLocation(shaderProgram, 'u_Ambient_color'),
	  u_PVM_transform: gl.getUniformLocation(shaderProgram, 'u_PVM_transform'),
	  u_VM_transform: gl.getUniformLocation(shaderProgram, 'u_VM_transform'),

    },
  };

  // add an event handler so we can interactively rotate the model
  document.addEventListener('keydown',

      function key_event(event) {
 	  	if(event.keyCode == 83) {  //s slow
             tIncr *= 0.75;
     	} else if(event.keyCode == 70) {  //f faster
             tIncr *= 1.25;
         }

         drawScene(gl, programInfo, buffersCollection, angle_x, angle_y, angle_z);
         return false;
      })



/*
createBMathewGear(30, 8, 70, 70, 85, 95, 5, 5, 5, 218 / 255, 165 / 255, 32 / 255)
brendelGear(30, 6, 0.3)
perezGear(20, 20)

*/

  // build the object(s) we'll be drawing, put the data in buffers
  const buffers1 = initBuffers(gl,programInfo, createOxfordGear(20, 10, 100, 7, 5, .25, 111,171,111));
  const buffers2 = initBuffers(gl,programInfo, osbornemGear(20, 20));
  const buffers3 = initBuffers(gl,programInfo, brendelGear(20, 10, 1));
  const buffers4 = initBuffers(gl,programInfo, createBMathewGear(20, 11, 70, 70, 25, 75, 5, 20, 7, 175 / 255, 175 / 255, 175 / 255));
  const buffers5 = initBuffers(gl,programInfo, perezGear(20, 20));
  const buffers6 = initBuffers(gl,programInfo, createOxfordGear(20, 10, 1, 7, 7.5, .55, 111,211,111));
  const buffersFloor = initBuffers(gl,programInfo, createFloor(20,20));
  const buffersRoof = initBuffers(gl,programInfo, createFloor(20,20));
  const buffersRight = initBuffers(gl,programInfo, createFloor(20,20));
  const buffersLeft = initBuffers(gl,programInfo, createFloor(20,20));
  const buffersBack = initBuffers(gl,programInfo, createFloor(20,20));
  const buffersFront = initBuffers(gl,programInfo, createFloor(20,20));

  var buffersCollection = {};
  buffersCollection.gear1 = buffers1;
  buffersCollection.gear2 = buffers2;
  buffersCollection.gear3 = buffers3;
  buffersCollection.gear4 = buffers4;
  buffersCollection.gear5 = buffers5;
  buffersCollection.gear6 = buffers6;
  buffersCollection.floor = buffersFloor;
  buffersCollection.roof = buffersRoof;
  buffersCollection.right = buffersRight;
  buffersCollection.left = buffersRight;
  buffersCollection.back = buffersBack;
  buffersCollection.front = buffersFront;


  //enableAttributes(gl,buffersCollection,programInfo)

  // Draw the scene

var t = 0;
  self.animate = function (){
	t += tIncr;
	if (t > 1){
		t= 0;
	}
	angle_z += tIncr * 1000;
 	drawScene(gl, programInfo, buffersCollection, angle_x, angle_y, angle_z, t);
  	requestAnimationFrame(self.animate);

  }

  animate();
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl,programInfo, gearData) {

  // numberOfTeeth, numberOfSpokes, circlizer, spokeFraction, spokeZFatness,smallCoinFactor, red, green, blue
  //gearData = createOxfordGear(20, 10, 1, 7, 5, .25, 75,0,130);
  vertices = gearData[0];
  colors = gearData[1];
  normals = gearData[2];

  // Create  buffers for the object's vertex positions
  const vertexBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Now pass the list of vertices to the GPU to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(vertices),
                gl.STATIC_DRAW);


  // do likewise for colors
  const colorBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(colors),
                gl.STATIC_DRAW);


const normalBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  gl.bufferData(gl.ARRAY_BUFFER,
                new Float32Array(normals),
                gl.STATIC_DRAW);

  return {
    // each vertex in buffer has 3 floats
    num_vertices: vertices.length / 3,
    vertex: vertexBuffer,
    color: colorBuffer,
    normal: normalBuffer
  };

}
function enableAttributes(gl,buffers,programInfo) {

    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

  // Tell WebGL how to pull vertex positions from the vertex
  // buffer. These positions will be fed into the shader program's
  // "a_vertex" attribute.

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.vertexAttribPointer(
        programInfo.locations.a_vertex,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_vertex);


    // likewise connect the colors buffer to the "a_color" attribute
    // in the shader program
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.locations.a_color,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_color);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.locations.a_normal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.locations.a_normal);

}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffersCollection, angle_x, angle_y, angle_z, t) {
  gl.clearColor(1.0, 1.0, 1.0, 1.0);  // Clear to white, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  //make transform to implement interactive rotation

  var matrix = new Learn_webgl_matrix();

  var rotate_x_matrix = matrix.create();
  var rotate_y_matrix = matrix.create();
  var rotate_z_matrix = matrix.create();
  var lookat = matrix.create();
  var camera_location = [0,0,0];
  var control_points = [
					[1,1,4],
					[3,2,1],
					[7,3,-1],
					[3,5,-4],
					[1,3,2],
					[-1,2,-2],
					[-3,6,-5],
					[-5,3,-4],
					[-3,4,-3],
					[-4,5,-3],
					[-7,-1,-2],
					[-3,-2,3],
					[-1,0,4],
					[-1,1,3],
					[1,1,4]
					];
  function weight(t) {
	  return [	Math.pow(1-t,14)*Math.pow(t,0) * 1,
	  		  	Math.pow(1-t,13)*Math.pow(t,1) * 14,
		  	  	Math.pow(1-t,12)*Math.pow(t,2) * 91,
		  		Math.pow(1-t,11)*Math.pow(t,3) * 364,
	  			Math.pow(1-t,10)*Math.pow(t,4) * 1001,
  				Math.pow(1-t,9)*Math.pow(t,5) * 2002,
				Math.pow(1-t,8)*Math.pow(t,6) * 3003,
				Math.pow(1-t,7)*Math.pow(t,7) * 3423,
				Math.pow(1-t,6)*Math.pow(t,8) * 3003,
				Math.pow(1-t,5)*Math.pow(t,9) * 2002,
				Math.pow(1-t,4)*Math.pow(t,10) * 1001,
				Math.pow(1-t,3)*Math.pow(t,11) * 364,
				Math.pow(1-t,2)*Math.pow(t,12) * 91,
				Math.pow(1-t,1)*Math.pow(t,13) * 14,
				Math.pow(1-t,0)*Math.pow(t,14) * 1,
				];
  }
  var cp;
  var weights = weight(t);
  for(cp = 0; cp<15; cp++){
	  camera_location[0] += weights[cp] * control_points[cp][0];
	  camera_location[1] += weights[cp] * control_points[cp][1];
	  camera_location[2] += weights[cp] * control_points[cp][2];
  }


  var u_PVMtransform = matrix.create();
  var u_VMtransform = matrix.create();
  var scale = matrix.create();
  var proj = matrix.createFrustum(-1,1, -1, 1, 1, 3000);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.lookAt(lookat,
 			   camera_location[0],camera_location[1],camera_location[2],
 			   0,0,0,
 			   0,1,0);

  // matrix.lookAt(lookat,
	//   			5*Math.cos(t*Math.pi/180),0,5*Math.sin(t*Math.pi/180),
	// 			0,0,0,
	// 			0,1,0);

	matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
    matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
    matrix.rotate(rotate_z_matrix, angle_z, 0, 0, 1);




  gl.uniform3f(programInfo.locations.u_light_dir, 3, 3, 3);

  gl.uniform3f(programInfo.locations.u_light_color, 1.0, 1.0, 1.0);
  gl.uniform1f(programInfo.locations.u_shininess, 85);

	var fadeValue = 1;
	if(t<.15){
		fadeValue = t*7.75;
	}else if (t>.85){
		fadeValue = (1-t)*7.75
	} else {
		fadeValue = 1;
	}
	if (fadeValue> 1){
		fadeValue = 1;
	}


  gl.uniform1f(programInfo.locations.u_fade, fadeValue);

  gl.uniform3f(programInfo.locations.u_ambient_color, 0.2, 0.2, 0.2);


  //////////////floor/////////////////////
  	matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
	matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
	matrix.rotate(rotate_z_matrix, 0, 0, 0, 1);

    var floor = buffersCollection.floor;
    enableAttributes(gl,floor,programInfo);
	var translate = matrix.create();
    matrix.translate(translate,0,0,0);

      // Combine the two rotations into a single transformation
	  matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
			rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
	  matrix.multiplySeries(u_VMtransform, lookat,translate,
			rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);


      // Set the shader program's uniform
      gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
      gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);

    { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, floor.num_vertices);

    }

	//////////////roof/////////////////////
	  rotate_x_matrix = matrix.create();
      rotate_y_matrix = matrix.create();
      rotate_z_matrix = matrix.create();

	  matrix.rotate(rotate_x_matrix, 0, 1, 0, 0);
	  matrix.rotate(rotate_y_matrix, 180, 0, 1, 0);
	  matrix.rotate(rotate_z_matrix, 0, 0, 0, 1);

	  var roof = buffersCollection.roof;
	  enableAttributes(gl,roof,programInfo);
	  translate = matrix.create();
	  matrix.translate(translate,0,10,0);

		// Combine the two rotations into a single transformation
		matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
		matrix.multiplySeries(u_VMtransform, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);


		// Set the shader program's uniform
		gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
		gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);

	  { // now tell the shader (GPU program) to draw some triangles
		const offset = 0;
		gl.drawArrays(gl.TRIANGLES, offset, roof.num_vertices);

	  }

//////////////back/////////////////////
	  rotate_x_matrix = matrix.create();
	  rotate_y_matrix = matrix.create();
	  rotate_z_matrix = matrix.create();

	  matrix.rotate(rotate_x_matrix, 90, 1, 0, 0);
	  matrix.rotate(rotate_y_matrix, 0, 0, 1, 0);
	  matrix.rotate(rotate_z_matrix, 0, 0, 0, 1);

  	  var back = buffersCollection.back;
  	  enableAttributes(gl,roof,programInfo);
  	  translate = matrix.create();
  	  matrix.translate(translate,0,0,-10);

  		// Combine the two rotations into a single transformation
		matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
		matrix.multiplySeries(u_VMtransform, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);

  		// Set the shader program's uniform
  		gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
  		gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);

  	  { // now tell the shader (GPU program) to draw some triangles
  		const offset = 0;
  		gl.drawArrays(gl.TRIANGLES, offset, back.num_vertices);

  	  }
  //////////////front/////////////////////
  	  rotate_x_matrix = matrix.create();
  	  rotate_y_matrix = matrix.create();
  	  rotate_z_matrix = matrix.create();

  	  matrix.rotate(rotate_x_matrix, -90, 1, 0, 0);
  	  matrix.rotate(rotate_y_matrix, 0, 0, 1, 0);
  	  matrix.rotate(rotate_z_matrix, 0, 0, 0, 1);

	  var front = buffersCollection.front;
	  enableAttributes(gl,roof,programInfo);
	  translate = matrix.create();
	  matrix.translate(translate,0,0,10);
	    		// Combine the two rotations into a single transformation
		matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
		matrix.multiplySeries(u_VMtransform, lookat,translate,
			  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);

    		// Set the shader program's uniform
		gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
		gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
	  { // now tell the shader (GPU program) to draw some triangles
		const offset = 0;
		gl.drawArrays(gl.TRIANGLES, offset, front.num_vertices);

	  }
	  //////////////left/////////////////////
	  	  rotate_x_matrix = matrix.create();
	  	  rotate_y_matrix = matrix.create();
	  	  rotate_z_matrix = matrix.create();

	  	  matrix.rotate(rotate_x_matrix, 0, 1, 0, 0);
	  	  matrix.rotate(rotate_y_matrix, 0, 0, 1, 0);
	  	  matrix.rotate(rotate_z_matrix, -90, 0, 0, 1);

		  var left = buffersCollection.left;
		  enableAttributes(gl,roof,programInfo);
		  translate = matrix.create();
		  matrix.translate(translate,-10,0,0);
		    		// Combine the two rotations into a single transformation
			matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
				  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
			matrix.multiplySeries(u_VMtransform, lookat,translate,
				  rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);

	    		// Set the shader program's uniform
			gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
			gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
		  { // now tell the shader (GPU program) to draw some triangles
			const offset = 0;
			gl.drawArrays(gl.TRIANGLES, offset, left.num_vertices);

		  }
		  //////////////right/////////////////////
			 rotate_x_matrix = matrix.create();
			 rotate_y_matrix = matrix.create();
			 rotate_z_matrix = matrix.create();

			 matrix.rotate(rotate_x_matrix, 0, 1, 0, 0);
			 matrix.rotate(rotate_y_matrix, 0, 0, 1, 0);
			 matrix.rotate(rotate_z_matrix, 90, 0, 0, 1);

			 var right = buffersCollection.right;
			 enableAttributes(gl,roof,programInfo);
			 translate = matrix.create();
			 matrix.translate(translate,10,0,0);
					   // Combine the two rotations into a single transformation
			   matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
					 rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);
			   matrix.multiplySeries(u_VMtransform, lookat,translate,
					 rotate_z_matrix,rotate_x_matrix, rotate_y_matrix,scale);

				   // Set the shader program's uniform
			   gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
			   gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
			 { // now tell the shader (GPU program) to draw some triangles
			   const offset = 0;
			   gl.drawArrays(gl.TRIANGLES, offset, right.num_vertices);

			 }




////////////////////gear 1////////////////////////////
  var buffers1 = buffersCollection.gear1;
  enableAttributes(gl,buffers1,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, -angle_z+Math.PI/40, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,0,1.7,0);





    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);

  { // now tell the shader (GPU program) to draw some triangles
    const offset = 0;
    gl.drawArrays(gl.TRIANGLES, offset, buffers1.num_vertices);

  }


///////////////////GEAR 2//////////////////
  var buffers2 = buffersCollection.gear2;
  enableAttributes(gl,buffers2,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, 90, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, 90, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, -angle_z - Math.PI/40, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,-.9,1.6,-0.9);

    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
  { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, buffers2.num_vertices);

    }
///////////////////GEAR 3//////////////////
  var buffers3 = buffersCollection.gear3;
  enableAttributes(gl,buffers3,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, angle_z, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,0,0,-0.5);

    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
  { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, buffers3.num_vertices);

    }

///////////////////GEAR 4//////////////////
  var buffers4 = buffersCollection.gear4;
  enableAttributes(gl,buffers4,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, angle_z+Math.PI/6, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,-0.1,1.5,-1.755);


    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
  { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, buffers4.num_vertices);

    }
///////////////////GEAR 5//////////////////
  var buffers5 = buffersCollection.gear5;
  enableAttributes(gl,buffers5,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, angle_x, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, 35, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, angle_z - Math.PI, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,1.55,1.625,-0.55);


    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
  { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, buffers5.num_vertices);

    }

///////////////////GEAR 6//////////////////
  var buffers6 = buffersCollection.gear6;
  enableAttributes(gl,buffers6,programInfo);

  rotate_x_matrix = matrix.create();
  rotate_y_matrix = matrix.create();
  rotate_z_matrix = matrix.create();
  scale = matrix.create();
  translate = matrix.create();

  matrix.rotate(rotate_x_matrix, 90, 1, 0, 0);
  matrix.rotate(rotate_y_matrix, angle_y, 0, 1, 0);
  matrix.rotate(rotate_z_matrix, -angle_z, 0, 0, 1);
  matrix.scale(scale,0.8,0.8,0.8);
  matrix.translate(translate,-1.85,2.45,-.8);


    // Combine the two rotations into a single transformation
	matrix.multiplySeries(u_PVMtransform, proj, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,rotate_z_matrix,scale);
    matrix.multiplySeries(u_VMtransform, lookat,translate,
          rotate_x_matrix, rotate_y_matrix,scale);


    // Set the shader program's uniform
    gl.uniformMatrix4fv(programInfo.locations.u_VM_transform, false, u_VMtransform);
    gl.uniformMatrix4fv(programInfo.locations.u_PVM_transform, false, u_PVMtransform);
  { // now tell the shader (GPU program) to draw some triangles
      const offset = 0;
      gl.drawArrays(gl.TRIANGLES, offset, buffers6.num_vertices);

    }



}

//
// Initialize a shader program, so WebGL knows how to draw our data
// BOILERPLATE CODE, COPY AND PASTE
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.  BOILERPLATE CODE, COPY AND PASTE
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}



/*
//  build the object, including geometry (triangle vertices)
//  and possibly colors and normals for each vertex
function createGear() {
    const vertices = [];
    const colors = [];
    var i;
    var x = -0.5, y = 0, z = 0;
    var r = 0.1, g = 0.5, b = 0.9;


    for (i = 0; i < 10; i++) {

         vertices.push(x,y,z)
         vertices.push(x+0.2,y,z)
         vertices.push(x+0.1,y+0.3,z)

         colors.push(r,g,b);
         colors.push(r,g,b);
         colors.push(r,g,b);

         r += 0.2
         g += 0.2
         b += 0.2
         if (r > 1)
             r -= 1
         if (g > 1)
             g -= 1
         if (b > 1)
             b -= 1


         x += 0.1
         z += -0.05
    }
    return [vertices,colors]
}
*/
