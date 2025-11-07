let scenarios = [];
let currentScenario = null;

async function loadScenarios() {
    try {
        const response = await fetch('data/scenarios.json');
        scenarios = await response.json();
        
        // Initialiser avec le premier cas (ou un cas aléatoire)
        currentScenario = scenarios[0];
        
        // Mettre à jour le nom initial du patient dans la 3D
        currentPatientName = currentScenario.name; 
        console.log(`Scénario chargé : ${currentScenario.real_pathology}`);
    } catch (error) {
        console.error("Erreur lors du chargement des scénarios:", error);
    }
}

// Appeler au démarrage du script
loadScenarios();

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

    // Dans la fonction createScene, modifiez la gestion du clic (scene.onPointerDown) :

    // 6. Gestion des Interactions (Pointer et Clic)
    scene.onPointerDown = function (evt) {
        if (evt.button === 0) { // Clic gauche
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const pickedMesh = pickResult.pickedMesh;
                console.log("Objet cliqué : ", pickedMesh.name);

                // 🎯 Logique d'Interaction avec le Patient 
                if (pickedMesh.name.includes("PATIENT_MESH_RACINE") || pickedMesh.parent && pickedMesh.parent.name.includes("PATIENT_MESH_RACINE")) {
                    alert("Interaction : Vous examinez le patient !");
                    // Déclencher une interface 2D (HUD) pour choisir des examens ou poser des questions.
                }
                
                // Logique pour d'autres objets (ex: une trousse, un dossier)
                if (pickedMesh.name === "dossier_medical") {
                    // Ouvrir l'historique du patient
                }
            }
        }
    };
// ...


    return scene;
};

// --- Initialisation du Moteur Babylon ---
window.addEventListener('DOMContentLoaded', async function(){
    // ... (Initialisation du moteur) ...

    const modal = document.getElementById('consultation-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const hudPatientName = document.getElementById('patient-name-hud');

    let isConsultationActive = false; // Pour éviter de bouger la caméra pendant la consultation
    let currentPatientName = "Marc Dupont"; // Récupéré de la donnée patient

    // ... (Reste du code) ...
    
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true); 

    // Créer la scène de jeu
    const scene = await createScene(engine, canvas);

    // Boucle de rendu pour l'animation
    engine.runRenderLoop(function () {
        scene.render();
    });
    // À l'intérieur de window.addEventListener('DOMContentLoaded', ...)

    // --- Fonction pour ouvrir la modale ---
    function openConsultationModal(patientName) {
        modal.classList.remove('hidden');
        hudPatientName.textContent = patientName;
        isConsultationActive = true;
        // Détacher le contrôle de la caméra pour figer la vue
        scene.activeCamera.detachControl(canvas);
        // Masquer le curseur si nécessaire
        document.body.style.cursor = 'default';
    }

    // --- Fonction pour fermer la modale ---
    function closeConsultationModal() {
        modal.classList.add('hidden');
        isConsultationActive = false;
        // Rattacher le contrôle de la caméra pour permettre le mouvement
        scene.activeCamera.attachControl(canvas, true);
        document.body.style.cursor = 'pointer'; // Ou 'default'
    }
     // Gestion du redimensionnement de la fenêtre
    window.addEventListener("resize", function () {
        engine.resize();
    // --- Gestion du bouton Fermer ---
    closeModalBtn.addEventListener('click', closeConsultationModal);

    // --- Mise à jour de la logique de clic du patient (dans scene.onPointerDown) ---
    scene.onPointerDown = function (evt) {
        if (isConsultationActive) return; // Ignorer le clic si la modale est déjà ouverte

        if (evt.button === 0) { // Clic gauche
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const pickedMesh = pickResult.pickedMesh;
                
                // Si l'objet cliqué est le patient
                if (pickedMesh.name.includes("PATIENT_MESH_RACINE") || pickedMesh.parent && pickedMesh.parent.name.includes("PATIENT_MESH_RACINE")) {
                    openConsultationModal(currentPatientName); // Ouvrir la modale !
                    function openConsultationModal() {
    // ... code d'affichage de la modale
    
    // Mettre à jour les informations du HUD
    document.getElementById('patient-name-hud').textContent = currentScenario.name;
    
    const examenLog = document.getElementById('examen-log');
    examenLog.innerHTML = `<p>Patient : ${currentScenario.consultation_data.initial_dialogue}</p>`;
    examenLog.scrollTop = examenLog.scrollHeight; 
    
    // Désactiver le bouton "Interroger" s'il n'y a plus de questions à poser (logique plus tardive)
                    }
                    
                }
            }
    });
});
