const fs = require('fs');
const path = require('path');
const { normalizeInsideRepo } = require('./importer/pathGuard');

const QUESTION_FILE = 'data/processed/published-questions.json';
const REVIEW_FILE = 'reports/categorization-review.json';
const SUMMARY_FILE = 'reports/categorization-summary.md';

function rx(pattern) {
  return new RegExp(pattern, 'i');
}

function topic(code, unitCode, unitName, topicName, patterns) {
  return { code, unitCode, unitName, topicName, patterns: patterns.map(rx) };
}

const TAXONOMY = {
  biology: {
    framework: 'AP Biology',
    sourceUrl: 'https://apstudents.collegeboard.org/courses/ap-biology',
    topics: [
      topic('BIO-1A', 'BIO-1', 'Chemistry of Life', 'Water, polarity, and hydrogen bonding', ['\\bwater\\b', 'hydrogen bond', 'polarity', 'cohesion', 'adhesion', 'hydrophobic', 'hydrophilic']),
      topic('BIO-1B', 'BIO-1', 'Chemistry of Life', 'Macromolecules and enzymes', ['macromolecule', 'carbohydrate', 'lipid', 'fatty acid', 'functional group', 'carboxyl', 'protein', 'nucleic acid', 'enzyme', 'substrate', 'amino acid', 'peptide', 'dehydration', 'hydrolysis', 'isotope', 'atomic number', '\\bpH\\b', 'hydroxyl']),
      topic('BIO-2A', 'BIO-2', 'Cell Structure and Function', 'Cell structures and organelles', ['organelle', 'mitochondri', 'chloroplast', 'ribosome', 'nucleus', 'golgi', 'endoplasmic', '\\bER\\b', 'lysosome', 'vacuole', 'cytoskeleton', 'cell wall']),
      topic('BIO-2B', 'BIO-2', 'Cell Structure and Function', 'Membranes and transport', ['membrane', 'phospholipid', 'transport', 'diffusion', 'osmosis', 'active transport', 'endocytosis', 'exocytosis', 'tonic', 'channel protein', 'aquaporin']),
      topic('BIO-2C', 'BIO-2', 'Cell Structure and Function', 'Cell size and compartmentalization', ['surface area', 'volume', 'compartment', 'prokary', 'eukary', 'plasmid']),
      topic('BIO-3A', 'BIO-3', 'Cellular Energetics', 'Cellular respiration', ['cellular respiration', 'glycolysis', 'krebs', 'citric acid', 'electron transport', 'oxidative phosphorylation', 'fermentation', '\\bATP\\b', '\\bNADH\\b', '\\bFADH', 'catabolic', 'oxidation', 'free energy', '\\bΔG\\b', 'entropy', 'enthalpy', 'equilibrium']),
      topic('BIO-3B', 'BIO-3', 'Cellular Energetics', 'Photosynthesis', ['photosynthesis', 'chlorophyll', 'light reaction', 'calvin', 'rubisco', 'thylakoid', 'stroma', 'photorespiration', '\\bC3\\b', '\\bC4\\b', '\\bCAM\\b']),
      topic('BIO-4A', 'BIO-4', 'Cell Communication and Cell Cycle', 'Signal transduction and feedback', ['signal transduction', 'receptor', 'ligand', 'second messenger', 'hormone', 'feedback', 'homeostasis', 'phosphorylation', 'kinase']),
      topic('BIO-4B', 'BIO-4', 'Cell Communication and Cell Cycle', 'Cell cycle, mitosis, and regulation', ['cell cycle', 'mitosis', 'meiosis', 'checkpoint', 'cyclin', 'cancer', 'chromatid', 'spindle', 'cytokinesis']),
      topic('BIO-5A', 'BIO-5', 'Heredity', 'Mendelian and non-Mendelian inheritance', ['mendel', 'inheritance', 'dominant', 'recessive', 'allele', 'genotype', 'phenotype', 'punnett', 'segregation', 'independent assortment', 'linked gene', 'pedigree']),
      topic('BIO-5B', 'BIO-5', 'Heredity', 'Meiosis and genetic variation', ['meiosis', 'crossing over', 'recombination', 'gamete', 'haploid', 'diploid', 'nondisjunction', 'trisomy', 'monosomy']),
      topic('BIO-6A', 'BIO-6', 'Gene Expression and Regulation', 'DNA, RNA, and protein synthesis', ['\\bDNA\\b', '\\bRNA\\b', 'transcription', 'translation', 'codon', 'anticodon', 'mRNA', 'tRNA', 'rRNA', 'polymerase', 'replication', 'mutation', 'operon']),
      topic('BIO-6B', 'BIO-6', 'Gene Expression and Regulation', 'Gene regulation and biotechnology', ['gene regulation', 'epigen', 'promoter', 'enhancer', 'repressor', 'plasmid', 'restriction enzyme', 'gel electrophoresis', '\\bPCR\\b', 'cloning', 'crispr']),
      topic('BIO-7A', 'BIO-7', 'Natural Selection', 'Natural selection and evolution', ['natural selection', 'evolution', 'fitness', 'adaptation', 'selection pressure', 'speciation', 'phylogen', 'common ancestor', 'homolog', 'analogous']),
      topic('BIO-7B', 'BIO-7', 'Natural Selection', 'Population genetics', ['hardy', 'weinberg', 'allele frequency', 'genetic drift', 'gene flow', 'bottleneck', 'founder effect', 'mutation rate']),
      topic('BIO-8A', 'BIO-8', 'Ecology', 'Population and community ecology', ['population', 'community', 'competition', 'predation', 'symbiosis', 'mutualism', 'commensalism', 'parasitism', 'carrying capacity', 'logistic', 'exponential growth']),
      topic('BIO-8B', 'BIO-8', 'Ecology', 'Ecosystems and biogeochemical cycles', ['ecosystem', 'food web', 'trophic', 'primary productivity', 'carbon cycle', 'nitrogen cycle', 'phosphorus cycle', 'denitrification', 'biodiversity', 'succession']),
      topic('BIO-UIL-ANP', 'UIL-BIO', 'UIL Biology: Anatomy and Physiology', 'Animal systems, tissues, and homeostasis', ['skeletal', 'bone marrow', 'axial', 'appendicular', 'circulatory', 'cardiovascular', 'blood vessel', 'arteries', 'capillaries', 'veins', 'heart', 'lung', 'neuron', 'nerve', 'dendrite', 'synapse', 'ganglia', 'connective tissue', 'extracellular matrix']),
      topic('BIO-UIL-PLANT', 'UIL-BIO', 'UIL Biology: Plant Biology', 'Plant structure and function', ['plant organ', 'root', 'stem', 'leaf', 'flower', 'xylem', 'phloem', 'meristem', 'trichome', 'root hair', 'dermal', 'ground tissue', 'vascular']),
      topic('BIO-UIL-DIV', 'UIL-BIO', 'UIL Biology: Diversity and Classification', 'Biodiversity, taxonomy, and organismal biology', ['binomial', 'nomenclature', 'genus', 'species', 'green algae', 'fern', 'moss', 'arthropod', 'metamorphosis', 'larva', 'pupa', 'chrysalis', 'cocoon', 'reptile', 'bacteria', 'cocci', 'spirilli'])
    ]
  },
  chemistry: {
    framework: 'AP Chemistry',
    sourceUrl: 'https://apstudents.collegeboard.org/courses/ap-chemistry',
    topics: [
      topic('CHEM-1A', 'CHEM-1', 'Atomic Structure and Properties', 'Atomic structure and periodic trends', ['atomic structure', 'isotope', 'proton', 'neutron', 'electron configuration', 'orbital', 'ionization energy', 'ionize', 'electron affinity', 'atomic radius', 'electronegativity', 'periodic trend']),
      topic('CHEM-1B', 'CHEM-1', 'Atomic Structure and Properties', 'Photoelectron spectroscopy and mass spectrometry', ['photoelectron', '\\bPES\\b', 'mass spect', 'average atomic mass', 'abundance']),
      topic('CHEM-2A', 'CHEM-2', 'Compound Structure and Properties', 'Bonding and molecular structure', ['ionic bond', 'covalent', 'bond order', 'lewis', 'resonance', 'formal charge', 'hybridization', 'hybridation', 'molecular geometry', '\\bVSEPR\\b', 'sigma bond', 'pi bond', 's\\s*p\\s*2', 's\\s*p\\s*3']),
      topic('CHEM-2B', 'CHEM-2', 'Compound Structure and Properties', 'Intermolecular forces', ['intermolecular', '\\bIMF\\b', 'london dispersion', 'dipole', 'hydrogen bond', 'boiling point', 'vapor pressure', 'viscosity', 'surface tension']),
      topic('CHEM-3A', 'CHEM-3', 'Properties of Substances and Mixtures', 'Gases, liquids, solids, and solutions', ['gas law', 'ideal gas', '\\bPV\\b', 'pressure', 'volume', 'temperature', 'molarity', 'solution', 'solubility', 'colligative', 'phase diagram', 'crystal lattice']),
      topic('CHEM-3B', 'CHEM-3', 'Properties of Substances and Mixtures', 'Stoichiometry and concentration', ['stoichiometry', 'limiting reactant', 'mole ratio', 'molar mass', 'molality', 'density', 'percent yield', 'empirical formula', 'molecular formula', 'dilution', 'titration', 'molarity']),
      topic('CHEM-4A', 'CHEM-4', 'Chemical Reactions', 'Reaction types and net ionic equations', ['chemical reaction', 'balance the following', 'coefficients', 'net ionic', 'precipitation', 'redox', 'oxidation number', 'combustion', 'synthesis', 'decomposition', 'single replacement', 'double replacement']),
      topic('CHEM-5A', 'CHEM-5', 'Kinetics', 'Reaction rates and mechanisms', ['kinetic', 'rate law', 'reaction rate', 'activation energy', 'catalyst', 'mechanism', 'elementary step', 'rate constant', 'half-life', 'arrhenius']),
      topic('CHEM-6A', 'CHEM-6', 'Thermochemistry', 'Energy changes and calorimetry', ['thermochem', 'enthalpy', '\\bdelta h\\b', '∆H', 'vaporization', 'fusion', 'heat removed', 'heat must be', 'calorim', 'heat capacity', 'specific heat', 'hess', 'endothermic', 'exothermic']),
      topic('CHEM-7A', 'CHEM-7', 'Equilibrium', 'Chemical equilibrium', ['equilibrium', '\\bKc\\b', '\\bKp\\b', 'reaction quotient', '\\bQ\\b', 'le chatelier', 'solubility product', '\\bKsp\\b']),
      topic('CHEM-8A', 'CHEM-8', 'Acids and Bases', 'Acid-base chemistry', ['acid', 'base', '\\bpH\\b', '\\bpOH\\b', '\\bKa\\b', '\\bKb\\b', 'buffer', 'henderson', 'bronsted', 'lewis acid', 'titration', 'equivalence point']),
      topic('CHEM-9A', 'CHEM-9', 'Thermodynamics and Electrochemistry', 'Thermodynamics and spontaneity', ['thermodynamic', 'entropy', '∆S', 'gibbs', 'free energy', '\\bdelta g\\b', 'spontaneous', 'standard potential', 'work done', 'gas phase reaction']),
      topic('CHEM-9B', 'CHEM-9', 'Thermodynamics and Electrochemistry', 'Electrochemistry', ['electrochem', 'galvanic', 'voltaic', 'electrolytic', 'anode', 'cathode', 'nernst', 'cell potential', 'faraday']),
      topic('CHEM-UIL-NOM', 'UIL-CHEM', 'UIL Chemistry: Nomenclature and Formula Writing', 'Names, formulas, and common ions', ['formula for', 'chemical formula', 'name for the compound', 'ammonium', 'chromate', 'iodate', 'sulfate', 'sulfite', 'copper\\(II\\)', 'cobalt\\(II\\)', 'acetate'])
    ]
  },
  physics: {
    framework: 'AP Physics / UIL Physics',
    sourceUrl: 'https://apstudents.collegeboard.org/courses/ap-physics-1-algebra-based',
    topics: [
      topic('PHYS-1A', 'PHYS-1', 'Kinematics', 'Motion in one and two dimensions', ['kinematic', 'velocity', 'acceleration', 'projectile', 'displacement', 'free fall', 'constant acceleration', 'relative motion', 'unit vector', 'vectors?', 'base unit', '\\bSI\\b']),
      topic('PHYS-2A', 'PHYS-2', 'Force and Translational Dynamics', 'Forces and Newton\'s laws', ['newton', 'force', 'friction', 'normal force', 'tension', 'inclined plane', 'free-body', 'centripetal', 'apparent weight', 'young.?s modulus', 'stretch under this load', 'steel wire', 'cable']),
      topic('PHYS-3A', 'PHYS-3', 'Work, Energy, and Power', 'Work, energy, and conservation', ['work', 'kinetic energy', 'potential energy', 'mechanical energy', 'conservation of energy', 'power', 'spring constant']),
      topic('PHYS-4A', 'PHYS-4', 'Linear Momentum', 'Momentum and impulse', ['momentum', 'impulse', 'collision', 'elastic', 'inelastic', 'center of mass']),
      topic('PHYS-5A', 'PHYS-5', 'Torque and Rotational Dynamics', 'Torque and angular motion', ['torque', 'rotation', 'angular', 'moment of inertia', 'rotational', 'rolling', 'lever arm', 'rev/min', 'ferris wheel']),
      topic('PHYS-6A', 'PHYS-6', 'Energy and Momentum of Rotating Systems', 'Rotational energy and angular momentum', ['angular momentum', 'rotational kinetic', 'rotational energy', 'conservation of angular']),
      topic('PHYS-7A', 'PHYS-7', 'Oscillations', 'Simple harmonic motion', ['oscillation', 'simple harmonic', '\\bSHM\\b', 'pendulum', 'spring-mass', 'period', 'frequency', 'amplitude']),
      topic('PHYS-8A', 'PHYS-8', 'Fluids', 'Fluid mechanics', ['fluid', 'density', 'pressure', 'buoyancy', 'archimedes', 'bernoulli', 'continuity equation', 'flow rate']),
      topic('PHYS-9A', 'PHYS-9', 'Thermodynamics', 'Thermal physics and kinetic theory', ['thermodynamic', 'temperature', 'heat', 'entropy', 'ideal gas', 'kinetic theory', 'isothermal', 'adiabatic', 'specific heat', 'rms speed']),
      topic('PHYS-10A', 'PHYS-10', 'Electric Force, Field, and Potential', 'Electrostatics and potential', ['electric field', 'electric force', 'coulomb', 'charge', 'potential', 'voltage', 'capacitor', 'gauss']),
      topic('PHYS-11A', 'PHYS-11', 'Electric Circuits', 'Circuits', ['circuit', 'current', 'resistance', 'resistor', 'ohm', 'series', 'parallel', 'kirchhoff', 'capacitor']),
      topic('PHYS-12A', 'PHYS-12', 'Magnetism and Electromagnetism', 'Magnetism and induction', ['magnetic', 'magnetism', 'lorentz', 'solenoid', 'induction', 'faraday', 'lenz', 'electromagnetic']),
      topic('PHYS-13A', 'PHYS-13', 'Geometric Optics', 'Reflection, refraction, and lenses', ['lens', 'mirror', 'refraction', 'reflection', 'snell', 'focal length', 'image distance', 'ray diagram']),
      topic('PHYS-14A', 'PHYS-14', 'Waves, Sound, and Physical Optics', 'Waves and sound', ['wave', 'sound', 'doppler', 'standing wave', 'interference', 'diffraction', 'wavelength', 'frequency', 'harmonic']),
      topic('PHYS-15A', 'PHYS-15', 'Modern Physics', 'Quantum, atomic, and nuclear physics', ['quantum', 'photon', 'photoelectric', 'de broglie', 'relativ', '\\bmc2\\b', 'nuclear', 'radioactive', 'half-life', 'fission', 'fusion', 'atomic spectrum', 'heaviest atom']),
      topic('PHYS-UIL-ASTRO', 'UIL-ASTRO', 'UIL Astronomy', 'Astronomy and space science', ['astronomy', 'according to tyson', 'tyson', 'pluto', 'charon', 'hydra', 'nix', 'phobos', 'tombaugh', 'percival lowell', 'mars', 'star', 'planet', 'galaxy', 'kepler', 'redshift', 'black hole', 'supernova', 'stellar', 'luminosity', 'parallax', 'telescope'])
    ]
  }
};

function normalizeText(q) {
  return [
    q.stem,
    ...(Array.isArray(q.choices) ? q.choices.map(c => c.text || c) : [])
  ].join(' ').replace(/\s+/g, ' ');
}

function classify(q) {
  const taxonomy = TAXONOMY[q.subject];
  const text = normalizeText(q);
  if (!taxonomy) return null;
  const hits = taxonomy.topics.map(t => {
    const evidence = [];
    for (const pattern of t.patterns) {
      const match = text.match(pattern);
      if (match) evidence.push(match[0]);
    }
    return evidence.length ? { topic: t, score: evidence.length, evidence: [...new Set(evidence)].slice(0, 4) } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.topic.code.localeCompare(b.topic.code));

  if (!hits.length) {
    return {
      framework: taxonomy.framework,
      unitCode: '',
      unitName: 'Needs source review',
      topicCode: '',
      topicName: 'Needs source review',
      secondaryTopicCodes: [],
      topics: [],
      uilSpecificCategory: '',
      categorizationEvidence: [],
      categorizationStatus: 'needs-source-review',
      sourceReviewStatus: 'needs-authoritative-source-review',
      mappingMethod: 'ap-keyword-taxonomy-v1',
      requiredSources: q.categorization && q.categorization.requiredSources || [],
      frameworkSourceUrl: taxonomy.sourceUrl
    };
  }

  const primary = hits[0];
  const secondary = hits.slice(1, 6);
  return {
    framework: taxonomy.framework,
    unitCode: primary.topic.unitCode,
    unitName: primary.topic.unitName,
    topicCode: primary.topic.code,
    topicName: primary.topic.topicName,
    secondaryTopicCodes: secondary.map(h => h.topic.code),
    topics: hits.slice(0, 6).map((h, index) => ({
      code: h.topic.code,
      unitCode: h.topic.unitCode,
      unitName: h.topic.unitName,
      topicName: h.topic.topicName,
      role: index === 0 ? 'primary' : 'secondary',
      evidence: h.evidence
    })),
    uilSpecificCategory: primary.topic.unitCode.startsWith('UIL-') ? primary.topic.unitName : '',
    categorizationEvidence: primary.evidence.map(term => ({ term, source: 'question-text-or-choice' })),
    categorizationStatus: 'ap-aligned-keyword-mapped',
    sourceReviewStatus: 'needs-authoritative-source-review',
    mappingMethod: 'ap-keyword-taxonomy-v1',
    confidence: primary.score >= 3 ? 'medium' : 'low',
    requiredSources: q.categorization && q.categorization.requiredSources || [],
    frameworkSourceUrl: taxonomy.sourceUrl
  };
}

function summarize(questions) {
  const bySubject = {};
  const byUnit = {};
  let mapped = 0;
  let multiTopic = 0;
  for (const q of questions) {
    const c = q.categorization || {};
    bySubject[q.subject] = bySubject[q.subject] || { total: 0, mapped: 0, multiTopic: 0 };
    bySubject[q.subject].total++;
    if (c.categorizationStatus === 'ap-aligned-keyword-mapped') {
      mapped++;
      bySubject[q.subject].mapped++;
    }
    if (Array.isArray(c.topics) && c.topics.length > 1) {
      multiTopic++;
      bySubject[q.subject].multiTopic++;
    }
    const key = `${q.subject || 'unknown'} | ${c.unitName || 'Needs source review'}`;
    byUnit[key] = (byUnit[key] || 0) + 1;
  }
  return { mapped, multiTopic, bySubject, byUnit };
}

function main() {
  const data = JSON.parse(fs.readFileSync(normalizeInsideRepo(QUESTION_FILE), 'utf8'));
  data.questions = data.questions.map(q => {
    const next = classify(q);
    if (!next) return q;
    return { ...q, categorization: next };
  });
  data.categorizationPolicy = {
    schemaVersion: 1,
    mappingMethod: 'ap-keyword-taxonomy-v1',
    displayStatus: 'AP-aligned; needs authoritative source review',
    allowsMultipleTopics: true,
    sourceNote: 'Mappings are deterministic keyword labels for study navigation. They are not claim-level verified explanations.'
  };
  fs.writeFileSync(normalizeInsideRepo(QUESTION_FILE), JSON.stringify(data, null, 2) + '\n');

  const summary = summarize(data.questions);
  const reviewRows = data.questions.map(q => ({
    examId: q.examId,
    question: q.sourceQuestionCode,
    subject: q.subject,
    unitCode: q.categorization.unitCode,
    unitName: q.categorization.unitName,
    topicCode: q.categorization.topicCode,
    topicName: q.categorization.topicName,
    secondaryTopicCodes: q.categorization.secondaryTopicCodes,
    topicCount: Array.isArray(q.categorization.topics) ? q.categorization.topics.length : 0,
    status: q.categorization.categorizationStatus,
    sourceReviewStatus: q.categorization.sourceReviewStatus,
    evidence: q.categorization.categorizationEvidence
  }));
  fs.writeFileSync(normalizeInsideRepo(REVIEW_FILE), JSON.stringify(reviewRows, null, 2) + '\n');
  const unitLines = Object.entries(summary.byUnit).sort((a, b) => b[1] - a[1]).map(([unit, count]) => `- ${unit}: ${count}`);
  fs.writeFileSync(normalizeInsideRepo(SUMMARY_FILE), [
    '# Categorization Summary',
    '',
    `Questions mapped to AP-aligned units/topics: ${summary.mapped}`,
    `Questions with multiple topic tags: ${summary.multiTopic}`,
    '',
    'These labels are deterministic keyword mappings for navigation and filtering. They remain marked as needing authoritative source review.',
    '',
    '## By Subject',
    '',
    ...Object.entries(summary.bySubject).map(([subject, s]) => `- ${subject}: ${s.mapped}/${s.total} mapped, ${s.multiTopic} multi-topic`),
    '',
    '## By Unit',
    '',
    ...unitLines,
    ''
  ].join('\n'));
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) main();
