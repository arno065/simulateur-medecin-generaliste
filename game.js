// ====================================================================
// 1. DÉCLARATION DES VARIABLES GLOBALES ET ÉLÉMENTS DU DOM
// ====================================================================

let scenarios = [];
let currentScenario = null;
let isConsultationActive = false;
let scene; // Déclaré globalement pour Babylon
let canvas; // Déclaré globalement pour Babylon

// Éléments du DOM : Le script plante si l'un de ces ID n'est pas dans index.html !
const consultationModal = document.getElementById('consultation-modal');
const diagnosticModal = document.getElementById('diagnostic-modal');
const hudPatientName = document.getElementById('patient-name-hud');
const examenLog = document.getElementById('examen-log');

// Boutons
const closeModalBtn = document.getElementById('close-modal-btn');
const poseDiagnosticBtn = document.getElementById('diagnose-btn-hud');
const cancelDiagnosisBtn = document.getElementById('cancel-diagnosis-btn');
const diagnosisForm = document.getElementById('diagnosis-form');
const askSymptomsBtn = document.getElementById('ask-symptoms-btn');
const tempBtn = document.getElementById('temp-btn');


// ====================================================================
// 2. LOGIQUE DE CHARGEMENT DES DONNÉES
// ====================================================================

async function loadScenarios() {
    try {
        const response = await fetch('data/scenarios.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}. Vérifiez l'existence de data/scenarios.json.`);
        }
        scenarios = await response.json();
        
        currentScenario = scenarios[0]; // Démarre avec le premier cas
        console.log(`Scénario chargé : ${currentScenario.real_pathology}`);
        
    } catch (error) {
        console.error("ERREUR FATALE: Le chargement des scénarios a échoué. Le jeu ne peut pas démarrer la logique.", error);
        // Afficher un message d'erreur sur l'écran si possible
    }
}


// ====================================================================
// 3. GESTION DES MODALES (HUD)
// ====================================================================

// --- Fonction pour ouvrir la modale de CONSULTATION ---
function openConsultationModal() {
    if (!currentScenario) {
        alert("Erreur: Données patient non chargées.");
        return;
    }

    consultationModal.classList.remove('hidden');
    hudPatientName.textContent = currentScenario.name;
    isConsultationActive = true;
    
    // Initialiser le log avec le dialogue
    examenLog.innerHTML = `<p class="patient-line">Patient : ${currentScenario.consultation_data.initial_dialogue}</p>`;
    
    // Si la 3D est active, détacher le contrôle de la caméra
    if (scene && scene.activeCamera) {
        scene.activeCamera.detachControl(canvas);
    }
    document.body.style.cursor = 'default';
}

// --- Fonction pour fermer la modale de CONSULTATION et retourner à la 3D ---
function closeConsultationModal() {
    consultationModal.classList.add('hidden');
    isConsultationActive = false;
    
    // Si la 3D est active, rattacher le contrôle
    if (scene && scene.activeCamera) {
        scene.activeCamera.attachControl(canvas, true);
    }
    document.body.style.cursor = 'pointer';
}

// --- Fonction pour ouvrir la modale de DIAGNOSTIC ---
function openDiagnosticModal() {
    consultationModal.classList.add('hidden'); 
    diagnosticModal.classList.remove('hidden'); 
}

// --- Fonction pour annuler le diagnostic et revenir à la consultation ---
function cancelDiagnosis() {
    diagnosticModal.classList.add('hidden');
    consultationModal.classList.remove('hidden');
    
    // Réinitialiser le formulaire
    diagnosisForm.reset();
    document.getElementById('scoring-feedback').innerHTML = "";
    document.getElementById('submit-diagnosis-btn').disabled = false;
    document.getElementById('cancel-diagnosis-btn').textContent = "❌ Annuler et Continuer l'Examen";
}

// Lier les événements aux boutons du HUD
closeModalBtn.addEventListener('click', closeConsultationModal); 
poseDiagnosticBtn.addEventListener('click', openDiagnosticModal); 
cancelDiagnosisBtn.addEventListener('click', cancelDiagnosis); 


// ====================================================================
// 4. LOGIQUE MÉDICALE ET SCORING
// ====================================================================

// --- Logique pour Interroger ---
askSymptomsBtn.addEventListener('click', () => {
    if (!currentScenario || !currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"]) {
        examenLog.innerHTML += `<p class="system-message">Vous avez déjà posé toutes les questions pertinentes sur les symptômes.</p>`;
        return;
    }
    
    // Afficher les réponses stockées dans le JSON
    examenLog.innerHTML += `<p class="doctor-action">Vous : Pouvez-vous détailler vos symptômes ?</p>`;
    currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"].forEach(info => {
        examenLog.innerHTML += `<p class="patient-response">Patient : ${info}</p>`;
    });
    
    // Désactiver le bouton et simuler la "consommation" de l'information
    delete currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"];
    askSymptomsBtn.disabled = true; 
    
    examenLog.scrollTop = examenLog.scrollHeight;
});

// --- Logique pour Prendre la Température ---
tempBtn.addEventListener('click', () => {
    if (!currentScenario || !currentScenario.consultation_data.exam_results["Prendre la Température"]) {
        examenLog.innerHTML += `<p class="system-message">Vous avez déjà effectué cet examen.</p>`;
        return;
    }
    const result = currentScenario.consultation_data.exam_results["Prendre la Température"];
    
    examenLog.innerHTML += `<p class="doctor-action">Vous prenez la température du patient...</p>`;
    examenLog.innerHTML += `<p class="system-message">Résultat de la mesure (${result.result}) : ${result.message}</p>`;
    
    // Supprimer l'information pour éviter la redondance dans les données du scénario
    delete currentScenario.consultation_data.exam_results["Prendre la Température"];
    tempBtn.disabled = true;
    
    examenLog.scrollTop = examenLog.scrollHeight;
});


// --- Fonction d'Évaluation du Diagnostic ---
function evaluateDiagnosis(playerPathology, playerTreatment) {
    const evaluation = currentScenario.diagnosis_evaluation;
    let score = 0;
    let feedback = "";
    
    // 1. Évaluation du Diagnostic (Pathologie)
    if (playerPathology.toLowerCase().includes(evaluation.correct_diagnosis.toLowerCase())) {
        score += 50;
        feedback += "✅ Diagnostic Correct (50 points).<br>";
    } else {
        feedback += `❌ Diagnostic Incorrect. Le diagnostic réel était : ${evaluation.correct_diagnosis}.<br>`;
    }
    
    // 2. Évaluation du Traitement (Prescription)
    let mandatoryScore = 0;
    evaluation.treatment.mandatory.forEach(mandate => {
        if (playerTreatment.toLowerCase().includes(mandate.toLowerCase())) {
            mandatoryScore += 20;
            score += 20;
            feedback += `⭐ Prescription essentielle incluse : ${mandate} (+20 points).<br>`;
        }
    });

    if (mandatoryScore < evaluation.treatment.mandatory.length * 20) {
        feedback += "⚠️ Attention : Des prescriptions essentielles ont été oubliées.<br>";
    }

    // 3. Pénalité pour surtraitement (Antibiotique pour virus)
    const incorrectTreatment = "antibiotique"; 
    if (playerTreatment.toLowerCase().includes(incorrectTreatment)) {
        score -= 30; 
        feedback += `🛑 Erreur grave : Prescription d'un ${incorrectTreatment} pour une infection virale (-30 points).<br>`;
    }

    // --- Affichage du Résultat ---
    const finalScore = Math.max(0, score); 
    feedback += `<br><strong>Score Final : ${finalScore} / 100</strong>`;

    return feedback;
}

// --- Gestion de la Soumission du Formulaire ---
diagnosisForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    
    const pathology = document.getElementById('input-pathology').value.trim();
    const prescription = document.getElementById('input-prescription').value.trim();
    const feedbackDiv = document.getElementById('scoring-feedback');
    
    const resultFeedback = evaluateDiagnosis(pathology, prescription);
    
    feedbackDiv.innerHTML = resultFeedback;
    
    document.getElementById('submit-diagnosis-btn').disabled = true;
    
    document.getElementById('cancel-diagnosis-btn').textContent = "Patient Suivant / Fin de Partie"; 
});


// ====================================================================
// 5. INITIALISATION DU MOTEUR 3D BABYLON (Si vous voulez réactiver la 3D)
// ====================================================================

// Fonction asynchrone pour initialiser le moteur de jeu
const createScene = async function (engine, canvas) {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.7, 0.9, 1); 

    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1.8, -5), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.keysUp = [90]; camera.keysDown = [83]; camera.keysLeft = [81]; camera.keysRight = [68]; camera.speed = 0.5;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);
    ground.material = new BABYLON.StandardMaterial("groundMat", scene);
    ground.material.diffuseColor = new BABYLON.Color3(0.6, 0.4, 0.1);
    
    // Tentez de charger votre modèle 3D
    try {
        await BABYLON.SceneLoader.ImportMeshAsync("", "assets/", "scifi_girl_v.01 (1).glb", scene);
    } catch (error) {
        console.error("Erreur de chargement du modèle 3D. Le jeu continuera sans 3D interactive.", error);
    }
    
    // Gestion du clic sur le patient en 3D
    scene.onPointerDown = function (evt) {
        if (isConsultationActive) return;

        if (evt.button === 0) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const pickedMesh = pickResult.pickedMesh;
                // Logique pour identifier le patient
                if (pickedMesh.name.includes("PATIENT_MESH") || pickedMesh.parent && pickedMesh.parent.name.includes("PATIENT_MESH")) {
                    openConsultationModal(); 
                }
            }
        }
    };
    
    return scene;
};


// ====================================================================
// 6. DÉMARRAGE PRINCIPAL
// ====================================================================

window.addEventListener('DOMContentLoaded', async function(){
    
    // Étape 1: Tenter de charger les données vitales
    await loadScenarios(); 

    // Étape 2: Initialisation de la 3D
    canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true); 

    scene = await createScene(engine, canvas);

    // Boucle de rendu
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Gestion du redimensionnement
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // Étape 3: Démarrez la consultation (si la 3D ne fonctionne pas, ça assure que le HUD apparaît)
    // Au début, on ouvre la modale de consultation directement pour le premier patient.
    // Si la 3D fonctionne, commentez cette ligne et laissez le clic 3D gérer l'ouverture.
    if (!currentScenario) {
        console.error("Le jeu est bloqué car les données sont manquantes.");
    } else {
        openConsultationModal();
    }
});
