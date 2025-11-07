
// Fonction asynchrone pour initialiser le moteur de jeu
const createScene = async function (engine, canvas) {
    // 1. Création de la Scène
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.7, 0.9, 1); // Ciel bleu clair

    // 2. Ajout de la Caméra (Contrôleur Première Personne)
    // C'est une caméra FreeCamera avec contrôle de l'utilisateur
    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1.8, -5), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    // Configuration pour le mouvement "première personne"
    camera.keysUp = [90];    // Z
    camera.keysDown = [83];  // S
    camera.keysLeft = [81];  // Q
    camera.keysRight = [68]; // D
    camera.speed = 0.5; // Vitesse de déplacement

    // 3. Ajout de l'Éclairage
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // 4. Création d'un Sol (pour se déplacer dessus)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1);

    // 5. Simuler le Cabinet (un mur simple pour l'exemple)
    const wall = BABYLON.MeshBuilder.CreateBox("wall", {width: 10, height: 3, depth: 0.1}, scene);
    wall.position = new BABYLON.Vector3(0, 1.5, 5); // Mur au fond

    // 6. Gestion des Interactions (Pointer et Clic)
    scene.onPointerDown = function (evt) {
        if (evt.button === 0) { // Clic gauche
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                console.log("Objet cliqué : ", pickResult.pickedMesh.name);
                // C'est ici que la logique d'interaction se passerait
                // Exemple : Si pickResult.pickedMesh.name === "patient", démarrer l'examen.
            }
        }
    };

    return scene;
};

// --- Initialisation du Moteur Babylon ---
window.addEventListener('DOMContentLoaded', async function(){
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true); 

    // Créer la scène de jeu
    const scene = await createScene(engine, canvas);

    // Boucle de rendu pour l'animation
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Gestion du redimensionnement de la fenêtre
    window.addEventListener("resize", function () {
        engine.resize();
    });
});
