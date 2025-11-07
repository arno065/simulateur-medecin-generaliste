document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const patientNameElement = document.getElementById('nom-patient');
    const dialogueBox = document.getElementById('dialogue-box');
    const questionButton = document.getElementById('questions');
    const examenButton = document.getElementById('examen');
    
    // Structure de données de base pour un patient
    let currentPatient = {
        name: "Marc Dupont",
        age: 45,
        motif: "Fièvre et douleurs musculaires",
        symptoms: ["fièvre (39°C)", "myalgies", "fatigue"],
        diagnosis: "Grippe saisonnière",
        isDiagnosed: false
    };

    // --- Fonction d'initialisation du patient ---
    function loadPatient(patient) {
        patientNameElement.textContent = patient.name;
        document.getElementById('age-patient').textContent = patient.age;
        document.getElementById('motif-visite').textContent = patient.motif;
        
        // Vider la boîte de dialogue pour le nouveau patient
        dialogueBox.innerHTML = `<p class="patient-line">Patient : Bonjour Docteur, ${patient.motif.toLowerCase()}.</p>`;
    }

    // --- Gestion de l'action Interroger (Questions) ---
    questionButton.addEventListener('click', () => {
        if (!currentPatient.isDiagnosed) {
            let info = currentPatient.symptoms.join(", ");
            const doctorLine = `<p>Vous : Je vais vous poser quelques questions sur vos symptômes.</p>`;
            const patientLine = `<p class="patient-line">Patient : Je ressens principalement : ${info}.</p>`;
            dialogueBox.innerHTML += doctorLine + patientLine;
            dialogueBox.scrollTop = dialogueBox.scrollHeight; // Scroll vers le bas
        } else {
            alert("Le diagnostic est posé, terminez la consultation.");
        }
    });

    // --- Initialiser le premier patient au chargement ---
    loadPatient(currentPatient);
    
    // NOTE: Il faudrait ajouter la logique pour l'examen, le diagnostic, et le système de points ici.
});
