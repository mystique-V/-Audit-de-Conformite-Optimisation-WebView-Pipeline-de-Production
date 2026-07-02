// =========================================================
//  TP02.5 — Filtrage des événements SIEM (JavaScript)
//  Rôle : filtrer le tableau par IP source et par criticité,
//         UNIQUEMENT au clic sur le bouton "Appliquer les filtres".
// =========================================================


// --- 1. Récupération des éléments dans le DOM ---
// Le DOM est la représentation de la page que le JS peut manipuler.
// querySelector renvoie le PREMIER élément correspondant au sélecteur CSS.
// querySelectorAll renvoie TOUS les éléments correspondants (une liste).

const form      = document.querySelector('.filter-form');          // le formulaire entier
const ipInput   = document.getElementById('ip');                   // le champ texte (par son id)
const severity  = document.getElementById('severity');             // le menu déroulant (par son id)
const tbody     = document.querySelector('.events-table tbody');       // le corps du tableau (TP05)

// TP05 : les lignes ne sont PLUS mémorisées une fois pour toutes.
// querySelectorAll renvoie une liste FIGÉE ("statique") : une ligne injectée
// après coup n'y figurerait pas et échapperait au filtrage comme au compteur.
// On ré-interroge donc le DOM à chaque besoin via cette petite fonction.
function getRows() {
  return document.querySelectorAll('.events-table tbody tr');
}
const tableWrap = document.querySelector('.table-wrap');           // le conteneur du tableau


// --- 2. Création dynamique des éléments d'information ---
// On fabrique ici, en JS, deux éléments qui n'existent pas dans le HTML :
// un compteur de résultats et un message "aucun résultat".

// a) Le compteur "X / Y événements", inséré JUSTE AVANT le tableau.
const counter = document.createElement('p');   // on crée une balise <p>
counter.className = 'filter-count';            // on lui donne une classe (pour le CSS)
// TP05 : role="status" = région live "POLIE" (aria-live="polite" implicite).
// Le lecteur d'écran annonce le nouveau décompte quand il a fini sa lecture
// en cours — contrairement à role="alert" (assertif) qui INTERROMPT, réservé
// aux événements critiques (voir #sr-alert dans le HTML).
counter.setAttribute('role', 'status');
tableWrap.before(counter);                      // on l'insère avant le tableau

// b) Le message d'absence de résultat, inséré JUSTE APRÈS le tableau.
const emptyMsg = document.createElement('p');
emptyMsg.className = 'filter-empty';
emptyMsg.textContent = 'Aucun événement ne correspond aux filtres.';
emptyMsg.hidden = true;                          // caché tant qu'il y a des résultats
tableWrap.after(emptyMsg);


// --- 3. Fonction principale de filtrage ---
// On regroupe toute la logique dans une fonction, qu'on appellera au bon moment.
function applyFilters() {

  // Valeur tapée dans le champ IP : trim() enlève les espaces au début/fin,
  // toLowerCase() met en minuscules (pour comparer sans souci de casse).
  const ipQuery  = ipInput.value.trim().toLowerCase();

  // Valeur choisie dans le menu : "all", "critique", "warning" ou "info".
  const sevValue = severity.value;

  const rows = getRows();   // TP05 : liste FRAÎCHE des lignes (y compris injectées)

  let visible = 0;   // compteur de lignes affichées (on l'incrémente au fur et à mesure)

  // forEach parcourt chaque ligne <tr> une par une.
  rows.forEach(function (row) {

    // On récupère le texte de la cellule "IP Source" de CETTE ligne.
    // (On la cible grâce à son attribut data-label, déjà présent dans le HTML.)
    const rowIp = row
      .querySelector('[data-label="IP Source"]')
      .textContent
      .toLowerCase();

    // Correspondance IP : includes() renvoie true si l'IP de la ligne
    // CONTIENT le texte tapé. Recherche partielle : "185" trouve "185.220.101.5".
    // (Si le champ est vide, ipQuery = "" et includes("") est toujours vrai.)
    const matchIp = rowIp.includes(ipQuery);

    // Correspondance criticité :
    //  - si "Tous les niveaux" (all) est choisi -> tout passe ;
    //  - sinon, on vérifie que la ligne possède la classe sev-row-XXX correspondante.
    const matchSev = sevValue === 'all'
      || row.classList.contains('sev-row-' + sevValue);

    // La ligne s'affiche seulement si les DEUX conditions sont vraies (&& = ET).
    const show = matchIp && matchSev;

    // On affiche/masque via un style "inline" appliqué directement sur l'élément.
    //  - '' (chaîne vide) = on laisse le CSS décider (table-row en bureau, block en mobile) ;
    //  - 'none' = la ligne disparaît.
    // On utilise le style inline (et pas l'attribut hidden) car il reste TOUJOURS
    // prioritaire sur le CSS, y compris quand la ligne est en display:block sur mobile.
    row.style.display = show ? '' : 'none';

    if (show) visible++;   // on compte les lignes visibles
  });

  // Mise à jour du compteur ("3 / 7 événements").
  counter.textContent = visible + ' / ' + rows.length + ' événements';

  // Affiche le message uniquement si AUCUNE ligne n'est visible (visible === 0).
  emptyMsg.hidden = visible !== 0;
}


// --- 4. Branchement de l'événement ---
// addEventListener("submit", ...) exécute la fonction quand le formulaire est soumis,
// c'est-à-dire au clic sur "Appliquer les filtres" OU avec la touche Entrée dans le champ.
form.addEventListener('submit', function (event) {
  event.preventDefault();  // empêche le rechargement classique de la page (comportement par défaut)
  applyFilters();          // on lance le filtrage
});


// --- 4 bis. TP05 : injection d'un événement + annonce ARIA (spec n°2) ---
// Objectif : "forcer les lecteurs d'écran à notifier l'utilisateur dès qu'un
// nouvel événement réseau est injecté dans la page".
// Mécanique : il SUFFIT d'écrire du texte dans la région role="alert"
// (#sr-alert, déclarée dans le HTML) — le navigateur pousse alors l'annonce
// à la synthèse vocale. Aucune API JavaScript spéciale n'est nécessaire :
// c'est le rôle ARIA qui porte le comportement.

const injectBtn = document.getElementById('inject-btn');   // bouton de démonstration
const srAlert   = document.getElementById('sr-alert');     // région live assertive

// Petit catalogue d'événements plausibles pour la démonstration.
// Chaque objet contient tout ce qu'il faut pour fabriquer une ligne complète.
const SAMPLES = [
  { sev: 'critique', label: 'Critique', icon: '▲', type: 'Ransomware — chiffrement détecté', ip: '194.26.29.113',  action: 'Quarantaine', actionClass: 'action-quarantine' },
  { sev: 'critique', label: 'Critique', icon: '▲', type: 'Élévation de privilèges',          ip: '91.240.118.29',  action: 'Bloqué',      actionClass: 'action-blocked' },
  { sev: 'warning',  label: 'Warning',  icon: '◆', type: 'Authentifications échouées (x25)', ip: '80.94.95.226',   action: 'Surveillé',   actionClass: 'action-monitored' },
  { sev: 'info',     label: 'Info',     icon: '●', type: 'Mise à jour de signatures IDS',    ip: '10.10.5.2',      action: 'Autorisé',    actionClass: 'action-allowed' }
];

let evtCounter = 967;   // on poursuit la numérotation EVT- du tableau initial

function injectEvent() {
  // 1) On pioche un événement au hasard : Math.random() donne [0;1[,
  //    multiplié par la taille du tableau puis tronqué = un index valide.
  const e = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];

  // 2) Horodatage courant. toLocaleTimeString('fr-FR') force le format 24 h.
  const time = new Date().toLocaleTimeString('fr-FR');

  // 3) Construction de la ligne. Le "template literal" (accents graves ``)
  //    autorise le HTML multiligne et l'interpolation ${...}. On reproduit
  //    EXACTEMENT la structure des lignes existantes (classes sev-row-*,
  //    data-label, badge double codage) : le CSS responsive et le filtrage
  //    s'appliquent donc à la nouvelle ligne sans rien changer.
  const tr = document.createElement('tr');
  tr.className = 'sev-row-' + e.sev + ' row-new';
  tr.innerHTML = `
    <td data-label="Criticité"><span class="sev-badge sev-badge-${e.sev}"><span class="sev-icon" aria-hidden="true">${e.icon}</span>${e.label}</span></td>
    <td class="mono" data-label="Horodatage">${time}</td>
    <td class="mono" data-label="ID Événement">EVT-${++evtCounter}</td>
    <td class="mono" data-label="IP Source">${e.ip}</td>
    <td data-label="Type d'attaque">${e.type}</td>
    <td data-label="Action pare-feu"><span class="action ${e.actionClass}">${e.action}</span></td>`;

  // 4) prepend() insère EN TÊTE du tableau : l'événement le plus récent
  //    apparaît en premier, comme dans une vraie console SIEM.
  tbody.prepend(tr);

  // 5) L'ANNONCE : écrire dans la région role="alert" déclenche la
  //    notification vocale. La phrase est complète et explicite —
  //    criticité + type + IP + action — car c'est TOUT ce qu'entendra
  //    un utilisateur de lecteur d'écran.
  srAlert.textContent = 'Nouvel événement ' + e.label + ' : ' + e.type +
                        ' depuis ' + e.ip + ' — ' + e.action + '.';

  // 6) On ré-applique les filtres actifs : la nouvelle ligne est comptée,
  //    et masquée immédiatement si elle ne correspond pas aux critères.
  applyFilters();
}

injectBtn.addEventListener('click', injectEvent);


// --- 5. Initialisation ---
// Au chargement, on appelle applyFilters() une fois : cela n'a rien filtré
// (champ vide + "Tous les niveaux"), mais ça affiche le compteur "7 / 7 événements".
applyFilters();
