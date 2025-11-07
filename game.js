// ====================================================================
// 1. DÉCLARATION DES VARIABLES GLOBALES ET INITIALISATION DES DONNÉES
// ====================================================================

let scenarios = [];
let currentScenario = null;
let isConsultationActive = false; // Pour éviter de bouger la caméra pendant la consultation

// Éléments du DOM (Déclarés ici pour être accessibles par plusieurs fonctions)
const consultationModal = document.getElementById('consultation-modal');
const diagnosticModal = document.getElementById('diagnostic-modal');
const hudPatientName = document.getElementById('patient-name-hud');
const examenLog = document.getElementById('examen-log');

// Boutons principaux
const closeModalBtn = document.getElementById('close-modal-btn');
const poseDiagnosticBtn = document.getElementById('diagnose-btn-hud');
const cancelDiagnosisBtn = document.getElementById('cancel-diagnosis-btn');
const diagnosisForm = document.getElementById('diagnosis-form');
const askSymptomsBtn = document.getElementById('ask-symptoms-btn');
const tempBtn = document.getElementById('temp-btn');


// --- Chargement des Scénarios ---
async function loadScenarios() {
    try {
        // NOTE: Assurez-vous que le fichier 'data/scenarios.json' existe.
        const response = await fetch('data/scenarios.json');
        scenarios = await response.json();
        
        currentScenario = scenarios[0];
        console.log(`Scénario chargé : ${currentScenario.real_pathology}`);
        
    } catch (error) {
        console.error("Erreur lors du chargement des scénarios:", error);
    }
}


// ====================================================================
// 2. LOGIQUE D'AFFICHAGE DU HUD (GESTION DES MODALES)
// ====================================================================

// --- Fonction pour ouvrir la modale de CONSULTATION ---
function openConsultationModal() {
    if (!currentScenario) return; // Sécurité si les données n'ont pas chargé

    consultationModal.classList.remove('hidden');
    hudPatientName.textContent = currentScenario.name;
    isConsultationActive = true;
    
    // Initialiser le log avec le dialogue
    examenLog.innerHTML = `<p class="patient-line">Patient : ${currentScenario.consultation_data.initial_dialogue}</p>`;
    
    // Si la 3D est initialisée, détacher le contrôle de la caméra
    if (scene && scene.activeCamera) {
        scene.activeCamera.detachControl(canvas);
    }
    document.body.style.cursor = 'default';
}

// --- Fonction pour fermer la modale de CONSULTATION et retourner à la 3D ---
function closeConsultationModal() {
    consultationModal.classList.add('hidden');
    isConsultationActive = false;
    
    // Si la 3D est initialisée, rattacher le contrôle
    if (scene && scene.activeCamera) {
        scene.activeCamera.attachControl(canvas, true);
    }
    document.body.style.cursor = 'pointer';
}

// --- Fonction pour ouvrir la modale de DIAGNOSTIC ---
function openDiagnosticModal() {
    consultationModal.classList.add('hidden'); // Cacher la modale de consultation
    diagnosticModal.classList.remove('hidden'); // Afficher la modale de diagnostic
}

// --- Fonction pour annuler le diagnostic et revenir à la consultation ---
function cancelDiagnosis() {
    diagnosticModal.classList.add('hidden');
    consultationModal.classList.remove('hidden');
    // Réinitialiser les champs et le feedback (si nécessaire)
    document.getElementById('input-pathology').value = "";
    document.getElementById('input-prescription').value = "";
    document.getElementById('scoring-feedback').innerHTML = "";
    document.getElementById('submit-diagnosis-btn').disabled = false;
}


// ====================================================================
// 3. LOGIQUE MÉDICALE (GESTION DES BOUTONS DU HUD)
// ====================================================================

// --- Logique pour Interroger ---
askSymptomsBtn.addEventListener('click', () => {
    // Le code de cette fonction est bien écrit, il suffit de le placer ici :
    if (currentScenario && currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"]) {
        
        examenLog.innerHTML += `<p class="doctor-action">Vous : Pouvez-vous détailler vos symptômes ?</p>`;
        
        currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"].forEach(info => {
            examenLog.innerHTML += `<p class="patient-response">Patient : ${info}</p>`;
        });
        
        // Supprimer la question une fois qu'elle a été posée pour le réalisme
        delete currentScenario.consultation_data.symptoms_revealed["Interroger sur les Symptômes"];
        askSymptomsBtn.disabled = true; 
        
        examenLog.scrollTop = examenLog.scrollHeight;
    } else {
        examenLog.innerHTML += `<p class="system-message">Vous avez déjà posé toutes les questions pertinentes sur les symptômes.</p>`;
    }
});

// --- Logique pour Prendre la Température ---
tempBtn.addEventListener('click', () => {
    // Le code de cette fonction est bien écrit, il suffit de le placer ici :
    if (currentScenario && currentScenario.consultation_data.exam_results["Prendre la Température"]) {
        const result = currentScenario.consultation_data.exam_results["Prendre la Température"];
        
        examenLog.innerHTML += `<p class="doctor-action">Vous prenez la température du patient...</p>`;
        examenLog.innerHTML += `<p class="system-message">Résultat de la mesure (${result.result}) : ${result.message}</p>`;
        
        tempBtn.disabled = true;
        
        examenLog.scrollTop = examenLog.scrollHeight;
    }
});

// Lier les boutons d'affichage/fermeture des modales
closeModalBtn.addEventListener('click', closeConsultationModal); // Fermer la modale consultation
poseDiagnosticBtn.addEventListener('click', openDiagnosticModal); // Ouvrir la modale diagnostic
cancelDiagnosisBtn.addEventListener('click', cancelDiagnosis); // Annuler le diagnostic

// --- Fonction d'Évaluation du Diagnostic (à conserver intacte) ---
function evaluateDiagnosis(playerPathology, playerTreatment) {
    const evaluation = currentScenario.diagnosis_evaluation;
    let score = 0;
    let feedback = "";
    
    // ... (Code de scoring inchangé, car il était correct) ...
    // NOTE : Assurez-vous que le JSON contient la structure 'diagnosis_evaluation' !
    // ...

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

    // Pénalité si des traitements essentiels manquent
    if (mandatoryScore < evaluation.treatment.mandatory.length * 20) {
        feedback += "⚠️ Attention : Des prescriptions essentielles ont été oubliées.<br>";
    }

    // 3. Évaluation des Surobservations/Erreurs (Exemple : donner des antibiotiques pour un virus)
    const incorrectTreatment = "antibiotique"; 
    if (playerTreatment.toLowerCase().includes(incorrectTreatment)) {
        score -= 30; 
        feedback += `🛑 Erreur grave : Vous avez prescrit un ${incorrectTreatment} pour une infection virale (-30 points).<br>`;
    }

    // --- Affichage du Résultat ---
    const finalScore = Math.max(0, score); 
    feedback += `<br><strong>Score Final : ${finalScore} / 100</strong>`;

    if (finalScore >= 80) {
        feedback += `<br>Félicitations ! Prise en charge excellente. 💯`;
    } else if (finalScore >= 50) {
        feedback += `<br>Bien joué. Diagnostic correct, mais la prescription pourrait être améliorée.`;
    } else {
        feedback += `<br>Le patient n'est pas guéri. Veuillez revoir vos fondamentaux médicaux.`;
    }
    
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
// 4. INITIALISATION DU MOTEUR 3D BABYLON (Si vous voulez réactiver la 3D)
// ====================================================================

let scene;
let canvas;

// Fonction asynchrone pour initialiser le moteur de jeu
const createScene = async function (engine, canvas) {
    scene = new BABYLON.Scene(engine);
    // ... (Reste de la configuration de la scène, caméra, lumière, murs, etc.) ...

    // NOTE: Le chargement du modèle est TRÈS sensible.
    // patient_modele.glb doit être le nom exact.
    try {
        const patientMesh = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            "assets/", 
            "scifi_girl_v.01 (1).glb", 
            scene
        );
        const rootMesh = patientMesh.meshes[0];
        rootMesh.name = "PATIENT_MESH_RACINE"; 
        rootMesh.position = new BABYLON.Vector3(0, 0, 3);
        rootMesh.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
        console.log("Modèle du patient chargé !");
    } catch (error) {
        console.error("Erreur lors du chargement du modèle 3D :", error);
    }
    
    // Gestion du clic sur le patient en 3D
    scene.onPointerDown = function (evt) {
        if (isConsultationActive) return;

        if (evt.button === 0) {
            const pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit) {
                const pickedMesh = pickResult.pickedMesh;
                if (pickedMesh.name.includes("PATIENT_MESH_RACINE") || pickedMesh.parent && pickedMesh.parent.name.includes("PATIENT_MESH_RACINE")) {
                    openConsultationModal(); // Ouvre la modale de consultation
                }
            }
        }
    };
    
    return scene;
};


// --- Démarrage principal au chargement de la page ---
window.addEventListener('DOMContentLoaded', async function(){
    
    // Si la 3D ne fonctionne pas, décommentez LIGNE 1 pour afficher la modale directement au départ :
    // openConsultationModal(); 
    
    await loadScenarios(); // Charge les données AVANT d'initialiser le moteur 3D

    canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true); 

    scene = await createScene(engine, canvas);

    // Boucle de rendu pour l'animation
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Gestion du redimensionnement de la fenêtre
    window.addEventListener("resize", function () {
        engine.resize();
    });

    // Optionnel : Ouvrir la consultation directement si vous n'avez pas de 3D fonctionnelle pour le moment
    // openConsultationModal();
});
