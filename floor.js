

function createFloor(rMax,cMax) {
    const vertices = [];
    const colors = [];
    const normals = [];

	var r, c;

	for(r = -rMax; r < rMax; r++){
		for(c = -cMax; c < cMax; c++){
			vertices.push(r,-1.2,c,	r+1,-1.2,c, 	r,-1.2,c+1  );
			colors.push(75/256,75/256,75/256,  51/256,51/256,51/256,  11/256,11/256,11/256);
			normals.push(0,1,0,  0,1,0,  0,1,0);

			vertices.push(r+1,-1.2,c+1,	r+1,-1.2,c, 	r,-1.2,c+1  );
			colors.push(.2,0,.3,  .5,0,.7,  .7,0,.9);
			normals.push(0,1,0,  0,1,0,  0,1,0);

		}
	}





    return [vertices,colors,normals];
}
