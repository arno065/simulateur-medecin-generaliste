
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

    // ... (Début de la fonction createScene) ...

    // 4. Création d'un Sol et Murs (Déjà fait)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    // ... murs, etc.

    // 5. 🧑‍⚕️ Chargement Asynchrone du Modèle du Patient
    try {
        // Le premier argument ("") signifie charger tous les meshes du fichier.
        // Le deuxième argument ("assets/") est le chemin d'accès au dossier.
        // Le troisième argument ("patient_modele.glb") est le nom du fichier du modèle.
        const patientMesh = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            "assets/", 
            "scifi_girl_v.01 (1).glb", 
            scene
        );

        // Récupérer le conteneur racine du modèle chargé
        const rootMesh = patientMesh.meshes[0];

        // Positionner le patient dans la salle de consultation
        rootMesh.position = new BABYLON.Vector3(0, 0, 3); // Devant la caméra initiale
        
        // Mettre à l'échelle (si le modèle est trop grand ou trop petit)
        rootMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);

        console.log("Modèle du patient chargé avec succès !");

        // Assigner le mesh principal pour les interactions
        // Ceci est important pour détecter quand le joueur clique sur le patient
        rootMesh.name = "PATIENT_MESH_RACINE"; 

    } catch (error) {
        console.error("Erreur lors du chargement du modèle du patient:", error);
        // Vous pouvez ajouter ici un Mesh de secours pour signaler l'erreur
        const errorBox = BABYLON.MeshBuilder.CreateBox("errorBox", { size: 1 }, scene);
        errorBox.position = new BABYLON.Vector3(0, 0.5, 3);
    }

    // ... (Reste de la fonction, comme la gestion des pointeurs) ...
    
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
