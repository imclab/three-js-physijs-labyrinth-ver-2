var keys = {};
var moveTop = false, moveLeft=false, moveRight=false, moveBack = false;
var walltexture, walltexture2;
//load
var hero, heroWrap, board;
var texture = THREE.ImageUtils.loadTexture( 'content/ctf_b.png', new THREE.UVMapping(), function(){
    walltexture = THREE.ImageUtils.loadTexture( 'content/wall.jpg', new THREE.UVMapping(), function(){
        walltexture2 = THREE.ImageUtils.loadTexture( 'content/wall2.jpg', new THREE.UVMapping(), function(){
        loadHero();
        });
    } );
} );
var clock = new THREE.Clock();
var camera, light;
var currentAnimation = 'stand';
var materialTexture;

function loadHero(){
    var loader = new THREE.JSONLoader();
    loader.load( 'content/hero.js', function( h, m ) {
        //smooth skin
        h.computeMorphNormals();
        materialTexture = new THREE.MeshPhongMaterial({
            color: 0xffffff, specular: 0x111111, shininess: 50, wireframe: false,
            shading: THREE.SmoothShading, map: texture, morphTargets: true, morphNormals: true, metal: false
        });

        hero = new THREE.MorphAnimMesh( h, materialTexture);
        hero.materialTexture = materialTexture;
        hero.scale.set( 0.5, 0.5, 0.5 );
        hero.parseAnimations();
        hero.playAnimation( 'stand', 6 );
        init();
    });
}


function init() {
    var render = function () {
        var delta = clock.getDelta();
        hero.updateAnimation( 1000 * delta );
        camera.lookAt(hero.position);
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    };
    Physijs.scripts.worker = 'physijs_worker.js';
    Physijs.scripts.ammo = 'js/ammo.js';

    var width = window.innerWidth, height = window.innerHeight;
    var view_angle = 35, aspect = width / height, near = 1, far = 1000;

    var container = $('#container');

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.append(renderer.domElement);

    camera = new THREE.PerspectiveCamera(view_angle, aspect, near, far);
    var scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, -50 ,0));
    scene.add(camera);
    scene.addEventListener(
        'update',
        function () {
            moveHero();
            scene.simulate(undefined, 2);
        }
    );

    camera.position.set(0, 300, 0);
    hero.position.x = 50;
    hero.position.z = 50;
    scene.add(hero);

    addHero(scene);
    addLight(scene);
    addGround(scene);

    requestAnimationFrame(render);
    scene.simulate();

    $('body').keydown(function (e) {
        keys[e.which] = true;
        keyPress(e.which, renderer, scene,true);
    });

    $('body').keyup(function (e) {
        delete keys[e.which];
        keyPress(e.which, renderer, scene,false);
    });

}
function moveHero(){
        heroWrap.setLinearVelocity(
            new THREE.Vector3(0, 0, 0)
        );
    heroWrap.__dirtyPosition = true;
    if(moveTop){
        heroWrap.position.x += Math.cos( hero.rotation.y) ;
        heroWrap.position.z -= Math.sin( hero.rotation.y) ;
        /*heroWrap.setLinearVelocity(
            new THREE.Vector3(heroWrap.getLinearVelocity().x +Math.cos( hero.rotation.y), 0, heroWrap.getLinearVelocity().z - Math.sin( hero.rotation.y))
        );*/
        if(currentAnimation!='run')
            hero.playAnimation( 'run', 6 );
        currentAnimation = 'run';
    }
    if(moveBack){
        heroWrap.position.x -= Math.cos( hero.rotation.y );
        heroWrap.position.z += Math.sin( hero.rotation.y)*1;
        /*heroWrap.setLinearVelocity(
            new THREE.Vector3(heroWrap.getLinearVelocity().x-Math.cos( hero.rotation.y)*2, 0, heroWrap.getLinearVelocity().z + Math.sin( hero.rotation.y)*2)
        );*/
        if(currentAnimation!='run')
            hero.playAnimation( 'run', 6 );
        currentAnimation = 'run';
    }

    if(moveLeft){
        hero.rotation.y += Math.PI*2/180;
        if(currentAnimation!='run')
            hero.playAnimation( 'run', 6 );
        currentAnimation = 'run';
    }
    if(moveRight){
        hero.rotation.y -= Math.PI*2/180; //5
        if(currentAnimation!='run')
            hero.playAnimation( 'run', 6 );
        currentAnimation = 'run';
    }

    hero.position.x = heroWrap.position.x;
    hero.position.y = heroWrap.position.y;
    hero.position.z = heroWrap.position.z;
    camera.position.copy(heroWrap.position).add(new THREE.Vector3(0, 300,0));
    var states = [];
    for(var key in keys){
        states.push(key);
    }

    if(states.length==0) {
        if(currentAnimation!='stand') {
            hero.playAnimation( 'stand', 6 );
        }
        currentAnimation = 'stand';
    }
}

function keyPress(e,renderer,scene, upOrDown){
    switch (parseInt(e)) {
        case 38:
            moveTop = upOrDown;
            break;//up
        case 40:
            moveBack = upOrDown;
            break;//down
        case 37:
            moveLeft = upOrDown;
            break;//left
        case 39:
            moveRight = upOrDown;
            break;//right
        case 32:
            if(currentAnimation!='space')
                hero.playAnimation( 'jump', 6 );
            currentAnimation = 'space';
            break;//space
    }
    renderer.render(scene, camera);

}

function addHero(scene) {
   var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0xffffff }), 0, 0);
    heroWrap = new Physijs.SphereMesh(
        new THREE.SphereGeometry(10,32,32),
        boardMaterial,
        1000
    );
    heroWrap.visible=false;
    heroWrap.position.set(50, 10, 50);

    scene.add(heroWrap);
}

function addLight(scene) {
    // Light
    var light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(0, 200, 0);
    light.target.position.copy(hero.position);
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -.0001
    light.shadowMapWidth = light.shadowMapHeight = 2048;
    light.shadowDarkness = .7;
    scene.add(light);
}

function addGround(scene) {
    var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0x0000ff }), .4, .6);
    var level = LoadLevel();
    var ground_geometry = new THREE.CubeGeometry(50, 1, 50);
    board = new Physijs.BoxMesh(
        ground_geometry,
        boardMaterial,
        0 // mass
    );
    board.__dirtyPosition = true;
    board.position.y = -40;

    for (var i = 0; i < level.length; i++) {
        for (var j = 0; j < level[i].length; j++) {
            switch (level[i][j]) {
                case 0:
                    addBoardPart(i, j, level.length, level[i].length, scene);
                    break;
                case 1:
                    addWall(i, j, level.length, level[i].length, scene);
                    //addBoardPart(i, j, level.length, level[i].length, scene);
                    break;
                case 2:
                    //no holes :)
                    addBoardPart(i, j, level.length, level[i].length, scene);
                    //addHole(i, j, level.length, level[i].length, scene);
                    break;
                case 3:
                    addFinish(i, j, level.length, level[i].length, scene);
                    break;
            }
        }
    }    
    scene.add(board);    
}

function addFinish(x, z, rows, cols, scene) {
    addBoardPart(x, z, rows, cols);
    var finishMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    var geometry = new THREE.SphereGeometry(10, 32, 32);
    var finish = new Physijs.SphereMesh(geometry, finishMaterial, 0);
    finish.position.z = z *  50;
    finish.position.x = x * 50;
    finish.position.y = 5;

    finish.addEventListener('collision', function (object) {
        alert('You win!');        
    });    

    scene.add(finish);

}
function addBoardPart(x, z, rows, cols, scene) {
    var geometry = new THREE.CubeGeometry(50, 5, 50);
    //var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0x000000 }), .4, .6);
    var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: walltexture2}), .4, .6);
    var cube = new Physijs.BoxMesh(geometry, boardMaterial, 0);
    cube.position.y = 0;
    cube.position.x = x * 50;
    cube.position.z = z * 50;
    board.add(cube);
}

function addWall(x, z, rows, cols, scene) {
    var geometry = new THREE.CubeGeometry(50, 250, 50);
    //var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({ color: 0x0000ff }), .4, .6);
    var boardMaterial = Physijs.createMaterial(new THREE.MeshLambertMaterial({map: walltexture}), .4, .6);
    var cube = new Physijs.BoxMesh(geometry, boardMaterial, 0);
    cube.position.y = 0;
    cube.position.x = x * 50;
    cube.position.z = z * 50;
    board.add(cube);
}
function addHole(x, y, rows, cols, scene) {
	//add nothing :)
}


function LoadLevel() {
    return [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 2, 1, 0, 0, 2, 0, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1],
        [1, 0, 2, 0, 0, 1, 1, 1, 0, 2, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 1, 1, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 2, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1],
        [1, 2, 0, 1, 0, 1, 3, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
}

