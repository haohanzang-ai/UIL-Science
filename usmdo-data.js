/* USMDO Master Guide — content data. Original study notes only; no official USMDO exam content. */

var SECTIONS = {
  cell:    {label:"Cell Biology & Genetics", tag:"cell",    icon:"🧫"},
  physio:  {label:"Human Physiology",        tag:"physio",  icon:"🫀"},
  disease: {label:"Human Disease",           tag:"disease", icon:"🦠"}
};

/* Topic order = syllabus order used for tracker + "recommended next" logic */
var SYLLABUS = [
  {id:"cell-structure",        section:"cell",    title:"Cell Structure & Organelles"},
  {id:"cell-membrane",         section:"cell",    title:"Membrane Structure & Transport"},
  {id:"cell-signaling",        section:"cell",    title:"Cell Signaling & Communication"},
  {id:"cell-cycle",            section:"cell",    title:"Cell Cycle, Mitosis & Meiosis"},
  {id:"dna-replication",       section:"cell",    title:"DNA Replication & Repair"},
  {id:"central-dogma",         section:"cell",    title:"Transcription & Translation"},
  {id:"gene-regulation",       section:"cell",    title:"Gene Regulation & Epigenetics"},
  {id:"mendelian-genetics",    section:"cell",    title:"Mendelian Genetics & Pedigrees"},
  {id:"chromosomal-genetics",  section:"cell",    title:"Chromosomal Mutations & Disorders"},
  {id:"biotech",               section:"cell",    title:"Biotechnology Techniques"},

  {id:"physio-cardio",         section:"physio",  title:"Cardiovascular System"},
  {id:"physio-resp",           section:"physio",  title:"Respiratory System"},
  {id:"physio-nervous",        section:"physio",  title:"Nervous System"},
  {id:"physio-endocrine",      section:"physio",  title:"Endocrine System"},
  {id:"physio-digestive",      section:"physio",  title:"Digestive System"},
  {id:"physio-renal",          section:"physio",  title:"Renal & Urinary System"},
  {id:"physio-immune",         section:"physio",  title:"Immune System"},
  {id:"physio-musculo",        section:"physio",  title:"Musculoskeletal System"},
  {id:"physio-reproductive",   section:"physio",  title:"Reproductive System"},
  {id:"physio-blood",          section:"physio",  title:"Blood & Hematology"},

  {id:"disease-principles",    section:"disease", title:"Principles of Pathology"},
  {id:"disease-genetic",       section:"disease", title:"Genetic & Chromosomal Disorders"},
  {id:"disease-infectious",    section:"disease", title:"Infectious Disease Principles"},
  {id:"disease-immune-cancer", section:"disease", title:"Immune Dysfunction & Cancer Biology"}
];

var LEARN = {

"cell-structure": {
  simple: "A cell is the basic unit of life. Eukaryotic cells (like ours) divide labor among membrane-bound organelles instead of doing everything loose in the cytoplasm.",
  highYield: [
    "Nucleus: double membrane with pores; holds DNA wrapped around histones as chromatin.",
    "Mitochondria: site of oxidative phosphorylation/ATP synthesis; own circular DNA, divide by fission, inherited almost entirely from the egg (maternal).",
    "Rough ER: ribosome-studded, folds/processes proteins headed for secretion or membranes.",
    "Smooth ER: no ribosomes; lipid synthesis, drug/toxin detox, stores Ca2+ (muscle = sarcoplasmic reticulum).",
    "Golgi apparatus: modifies, sorts, and packages proteins/lipids into vesicles (cis face receives, trans face ships).",
    "Lysosomes: acidic, enzyme-filled sacs that digest waste, old organelles, and pathogens.",
    "Peroxisomes: break down fatty acids and detoxify, produce/break down hydrogen peroxide — not the same job as lysosomes.",
    "Cytoskeleton: microtubules (transport, spindle fibers), microfilaments/actin (movement, cytokinesis), intermediate filaments (structural support)."
  ],
  mechanism: "The endomembrane system works like an assembly line: proteins are made on the rough ER, shipped in vesicles to the Golgi for modification/sorting, then sent to their final destination (membrane, secretion, or a lysosome). Mitochondria (and chloroplasts in plants) are best explained by endosymbiotic theory — a free-living prokaryote was engulfed and retained, which is why these organelles have their own DNA, ribosomes, and a double membrane.",
  diseaseConnection: [
    "Mitochondrial DNA mutations → mitochondrial myopathies (muscle weakness, strict maternal inheritance pattern).",
    "Missing/defective lysosomal enzymes → lysosomal storage diseases (e.g., undigested lipids accumulate in neurons)."
  ],
  traps: [
    "Mitochondria are NOT inherited from both parents — almost exclusively maternal, from egg cytoplasm.",
    "Rough ER = protein processing; smooth ER = lipid/detox. A very common mix-up on exams.",
    "Lysosomes (digestion) vs. peroxisomes (fatty acid breakdown + detox) are easy to confuse — both are small membrane-bound sacs but different jobs."
  ],
  quiz: [
    {q:"Why do mitochondria have their own DNA?", c:["They are made by the nucleus and exported","Endosymbiotic origin from an engulfed prokaryote","They build it during cell division","All organelles contain DNA"], a:1, ex:"Endosymbiotic theory: mitochondria descend from free-living prokaryotes engulfed by an ancestral cell, explaining their own DNA, ribosomes, and double membrane."},
    {q:"A cell that secretes large amounts of protein hormone would be expected to have an abundance of which organelle?", c:["Smooth ER","Peroxisomes","Rough ER","Lysosomes"], a:2, ex:"Rough ER is studded with ribosomes that synthesize and begin folding secreted/membrane proteins."},
    {q:"Which organelle is most directly responsible for breaking down a worn-out organelle via acidic enzymes?", c:["Golgi apparatus","Lysosome","Peroxisome","Mitochondrion"], a:1, ex:"Lysosomes contain acid hydrolases that digest damaged organelles and macromolecules (autophagy)."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 4, Cell Structure", "NIGMS/NIH 'Inside the Cell' primer"]
},

"cell-membrane": {
  simple: "The cell membrane is a flexible, oily barrier (phospholipid bilayer) studded with proteins that controls what enters and leaves the cell.",
  highYield: [
    "Fluid mosaic model: phospholipids form a flexible bilayer; proteins/cholesterol float within it.",
    "Cholesterol buffers fluidity — keeps the membrane from becoming too stiff (cold) or too fluid (warm).",
    "Simple diffusion: small/nonpolar molecules (O2, CO2) cross freely down their gradient, no protein needed.",
    "Facilitated diffusion: polar/charged molecules (glucose, ions) cross via channel or carrier proteins, still passive (no ATP).",
    "Osmosis: water moves toward the side with more solute; cells in hypertonic solution shrink (crenate), in hypotonic solution swell/lyse.",
    "Active transport: moves substances against their gradient, requires ATP (e.g., Na+/K+ pump: 3 Na+ out, 2 K+ in per ATP).",
    "Endocytosis/exocytosis: bulk transport of large molecules via vesicles budding from or fusing with the membrane."
  ],
  mechanism: "Membrane selectivity comes from the hydrophobic core of the bilayer, which blocks ions and polar molecules unless a transport protein provides a path. Channel proteins form pores (fast, gradient-only); carrier proteins bind and change shape to ferry a specific molecule across (slower, can be active or passive). The Na+/K+ ATPase keeps the inside of cells negative relative to outside, setting up the gradient nerves and muscles depend on.",
  diseaseConnection: [
    "Cystic fibrosis: defective CFTR chloride channel → thick mucus in lungs/pancreas.",
    "Cholera toxin locks an intestinal Cl- channel open → massive water loss (osmosis) → severe diarrhea."
  ],
  traps: [
    "Facilitated diffusion is still passive (no ATP) even though it needs a protein — students often assume 'needs a protein' = active transport.",
    "Hypertonic vs. hypotonic is about the solution relative to the cell, not an absolute property.",
    "Osmosis is just diffusion of water — don't treat it as a separate unrelated process."
  ],
  quiz: [
    {q:"A red blood cell placed in a hypotonic solution will most likely:", c:["Shrink (crenate)","Stay the same size","Swell and possibly lyse","Stop all transport"], a:2, ex:"Hypotonic = more water outside relative to inside the cell, so water moves in by osmosis, causing swelling/lysis."},
    {q:"Glucose entering a cell via a membrane carrier protein, moving from high to low concentration, with no ATP used, is an example of:", c:["Active transport","Facilitated diffusion","Osmosis","Exocytosis"], a:1, ex:"Movement down a gradient via a protein, without ATP, defines facilitated diffusion."},
    {q:"The Na+/K+ ATPase pump is best classified as:", c:["Simple diffusion","Facilitated diffusion","Primary active transport","Osmosis"], a:2, ex:"It uses ATP directly to move ions against their gradients — the definition of primary active transport."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 5, Structure and Function of Plasma Membranes"]
},

"cell-signaling": {
  simple: "Cells talk to each other using signaling molecules that bind receptors and trigger a response inside the target cell.",
  highYield: [
    "Three signaling ranges: autocrine (self), paracrine (nearby cells), endocrine (hormones via bloodstream, long distance).",
    "Receptor types: cell-surface receptors (for large/polar ligands, e.g., peptide hormones) vs. intracellular receptors (for small/lipid-soluble ligands, e.g., steroid hormones, that cross the membrane directly).",
    "G-protein coupled receptors (GPCRs): ligand binds, activates a G-protein, which triggers a second messenger cascade (e.g., cAMP).",
    "Receptor tyrosine kinases (RTKs): ligand binding causes dimerization and autophosphorylation, starting a kinase cascade (e.g., growth factor signaling).",
    "Second messengers (cAMP, IP3, Ca2+) amplify a single signal into a large, fast intracellular response.",
    "Signal transduction cascade = a chain of activated proteins, each one amplifying the signal further (signal amplification)."
  ],
  mechanism: "Because a single hormone molecule can't directly enter most cells or cause much change on its own, cells convert ('transduce') an extracellular signal into an intracellular one through a relay of protein activations, often ending in activation of a transcription factor or enzyme. This relay both amplifies the signal (one receptor can activate many downstream molecules) and allows it to be finely tuned or shut off.",
  diseaseConnection: [
    "Cholera toxin permanently activates a G-protein in gut cells, locking on cAMP signaling and chloride secretion.",
    "Mutated, permanently 'on' growth factor receptors (RTKs) drive uncontrolled cell division in many cancers."
  ],
  traps: [
    "Steroid hormones use intracellular receptors and act mainly by changing gene transcription — not the same mechanism as GPCRs.",
    "'Second messenger' refers to small intracellular molecules (cAMP, Ca2+), not the receptor itself.",
    "Signal amplification means small extracellular signals can produce large, fast intracellular effects — don't assume 1 ligand = 1 response molecule."
  ],
  quiz: [
    {q:"A lipid-soluble steroid hormone most likely binds its receptor:", c:["On the outer cell membrane","Inside the cell, in the cytoplasm or nucleus","On a neighboring cell only","Only on red blood cells"], a:1, ex:"Steroid hormones are lipid-soluble and diffuse through the membrane to bind intracellular receptors, often acting as transcription factors."},
    {q:"The main functional purpose of a second-messenger cascade is to:", c:["Destroy the original signal immediately","Amplify and spread a signal inside the cell","Transport the ligand into the nucleus","Convert the ligand into a hormone"], a:1, ex:"Cascades amplify a single binding event into a much larger, faster intracellular response."},
    {q:"Paracrine signaling is best described as:", c:["A hormone traveling through the blood to a distant organ","A cell signaling itself","A cell signaling nearby cells through the extracellular space","Direct cytoplasm-to-cytoplasm signaling"], a:2, ex:"Paracrine signals act locally on nearby cells, unlike endocrine (bloodstream, distant) signaling."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 9, Cell Communication"]
},

"cell-cycle": {
  simple: "The cell cycle is the orderly sequence a cell follows to grow and divide; mitosis makes identical body cells, meiosis makes genetically varied sex cells.",
  highYield: [
    "Interphase (G1-S-G2) takes up ~90% of the cycle: G1 (growth), S (DNA replication), G2 (final prep/checkpoints).",
    "Mitosis phases: Prophase (chromosomes condense, spindle forms) → Metaphase (line up at the cell's equator) → Anaphase (sister chromatids pulled apart) → Telophase (nuclei reform); cytokinesis splits the cytoplasm.",
    "Checkpoints (G1/S, G2/M, spindle/metaphase) stop the cycle if DNA is damaged or chromosomes aren't attached correctly.",
    "p53 is the key tumor-suppressor checkpoint protein — triggers repair or apoptosis if DNA damage is detected.",
    "Meiosis = two divisions (Meiosis I separates homologous pairs, Meiosis II separates sister chromatids), producing 4 haploid cells from 1 diploid cell.",
    "Crossing over (prophase I) and independent assortment (metaphase I) are the two big sources of genetic variation in meiosis.",
    "Nondisjunction (failure of chromosomes to separate properly) causes aneuploidy, e.g., trisomy 21."
  ],
  mechanism: "Cyclins and cyclin-dependent kinases (CDKs) drive the cell through checkpoints — their rising and falling levels act like a timer that only allows the next phase to start once the right conditions are met. If DNA damage is detected, p53 halts the cycle at G1/S to allow repair, or pushes the cell toward apoptosis if damage is irreparable — this is why p53 loss is so strongly linked to cancer.",
  diseaseConnection: [
    "Loss-of-function p53 mutations (seen in over half of human cancers) let damaged cells keep dividing unchecked.",
    "Meiotic nondisjunction → Down syndrome (trisomy 21), Klinefelter syndrome (XXY), Turner syndrome (XO)."
  ],
  traps: [
    "Mitosis = 1 division, 2 diploid identical daughter cells. Meiosis = 2 divisions, 4 haploid genetically distinct cells. A very commonly tested contrast.",
    "Crossing over happens in prophase I, not during mitosis.",
    "A cell that is 'resting' (not dividing) is in G0, not G1 — they are different states."
  ],
  quiz: [
    {q:"Which event is the primary reason siblings (other than identical twins) are not genetically identical?", c:["Mitosis in skin cells","Crossing over and independent assortment in meiosis","DNA replication errors only","The cell cycle checkpoints"], a:1, ex:"Crossing over (prophase I) and independent assortment (metaphase I) shuffle parental alleles into new combinations in gametes."},
    {q:"A cell with significant DNA damage that fails to arrest at the G1/S checkpoint most likely has a defect in:", c:["Actin filaments","p53","The Golgi apparatus","tRNA"], a:1, ex:"p53 is the master checkpoint protein that halts the cycle (or triggers apoptosis) when DNA damage is detected; its loss is strongly linked to cancer."},
    {q:"Nondisjunction during meiosis I would most directly result in:", c:["A cell with the wrong number of chromosomes (aneuploidy)","A point mutation","Increased crossing over","A new species"], a:0, ex:"Nondisjunction means homologous chromosomes (or later, sister chromatids) fail to separate properly, producing gametes with too many or too few chromosomes."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 10, Cell Reproduction", "OpenStax Biology 2e — Ch. 11, Meiosis and Sexual Reproduction"]
},

"dna-replication": {
  simple: "Before a cell divides, it must copy its entire DNA so each daughter cell gets a full, accurate set of instructions.",
  highYield: [
    "DNA replication is semiconservative: each new double helix has one original (parent) strand and one newly made strand.",
    "Helicase unwinds/unzips the double helix at the origin of replication; topoisomerase relieves the resulting supercoiling ahead of it.",
    "DNA polymerase adds new nucleotides only in the 5' to 3' direction, and needs an existing primer (made by primase) to start.",
    "Leading strand is synthesized continuously; lagging strand is synthesized in short Okazaki fragments, later joined by DNA ligase.",
    "Proofreading by DNA polymerase (3' to 5' exonuclease activity) corrects most mismatched bases as replication occurs.",
    "Mismatch repair and nucleotide excision repair fix errors/damage that slip past replication (e.g., UV-induced thymine dimers)."
  ],
  mechanism: "Because DNA polymerase can only extend an existing strand in the 5'→3' direction, the two template strands (which run antiparallel) must be copied differently: continuously on the leading strand, and in short, backward-running fragments (Okazaki fragments) on the lagging strand, which are later sealed together by ligase. Multiple repair systems act as a safety net — proofreading during synthesis, then separate repair pathways afterward — which is why the overall mutation rate of DNA replication is extremely low.",
  diseaseConnection: [
    "Defective DNA repair genes (e.g., BRCA1/2, mismatch repair genes in Lynch syndrome) sharply raise cancer risk because mutations accumulate unchecked.",
    "Xeroderma pigmentosum: defective nucleotide excision repair → cannot fix UV damage → extreme skin cancer risk."
  ],
  traps: [
    "DNA polymerase cannot start a new strand from scratch — it always needs an RNA primer first.",
    "'Semiconservative' means each new molecule has one old + one new strand — not 'half the molecule is old, half is new' in a single strand sense.",
    "The lagging strand is not synthesized backward overall — it's made in fragments that are each synthesized 5'→3', then joined."
  ],
  quiz: [
    {q:"DNA replication is described as 'semiconservative' because:", c:["Only half of the genome is copied each cycle","Each new double helix contains one parental strand and one new strand","DNA polymerase conserves energy by skipping bases","Only the leading strand is copied"], a:1, ex:"Each daughter molecule retains one original template strand paired with a newly synthesized strand — Meselson-Stahl's classic finding."},
    {q:"Okazaki fragments are produced because:", c:["DNA polymerase works in both directions equally","DNA polymerase only synthesizes 5' to 3', requiring discontinuous synthesis on the lagging strand","Helicase cuts the DNA into pieces","Primase removes RNA primers"], a:1, ex:"Since the lagging strand template runs in the opposite direction, it must be copied in short fragments, each started by a new primer."},
    {q:"A person with a defective nucleotide excision repair pathway would have the greatest difficulty repairing damage caused by:", c:["Replication slippage","UV light-induced thymine dimers","Normal aging only","Osmotic stress"], a:1, ex:"Nucleotide excision repair removes bulky DNA lesions like UV-induced thymine dimers; its failure underlies xeroderma pigmentosum."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 14, DNA Structure and Function"]
},

"central-dogma": {
  simple: "Genetic information flows from DNA → RNA (transcription) → protein (translation); this one-way flow of information is the 'central dogma' of molecular biology.",
  highYield: [
    "Transcription occurs in the nucleus: RNA polymerase reads a DNA template strand and builds a complementary mRNA strand (uses U instead of T).",
    "Pre-mRNA processing: 5' cap and poly-A tail are added, and introns are spliced out, leaving only exons in the mature mRNA.",
    "Translation occurs at the ribosome: mRNA codons (3-base sequences) are matched to tRNA anticodons, each carrying a specific amino acid.",
    "The genetic code is degenerate (multiple codons can specify the same amino acid) but unambiguous (each codon specifies only one amino acid).",
    "Start codon (AUG) = methionine, sets the reading frame; stop codons (UAA, UAG, UGA) terminate translation, code for no amino acid.",
    "Ribosome has two subunits (large + small); tRNA enters the A site, peptide bond forms, then it shifts to the P site, then exits at the E site."
  ],
  mechanism: "RNA polymerase transcribes one gene at a time, only ever reading 3'→5' on the template strand (producing mRNA 5'→3'). After splicing removes non-coding introns, the mature mRNA leaves the nucleus and is read by ribosomes three bases (a codon) at a time. Each tRNA's anticodon base-pairs with a complementary mRNA codon, delivering the correct amino acid in order, and the growing polypeptide chain is released once a stop codon is reached.",
  diseaseConnection: [
    "A single nucleotide deletion or insertion causes a frameshift mutation, scrambling every codon downstream — usually far more damaging than a single substitution.",
    "Antibiotics like tetracyclines and macrolides work by blocking bacterial (not human) ribosomes, halting bacterial protein synthesis."
  ],
  traps: [
    "A point mutation (single base substitution) may be silent (same amino acid, due to code degeneracy), missense (different amino acid), or nonsense (premature stop) — know all three.",
    "Frameshift mutations (insertions/deletions not in multiples of 3) are typically far more damaging than substitutions because they shift every downstream codon.",
    "Introns are cut OUT; exons are EXpressed and stay in the mature mRNA — easy to mix up the names."
  ],
  quiz: [
    {q:"A mutation changes a codon from one that codes for leucine to a different codon that also codes for leucine. This is a:", c:["Frameshift mutation","Nonsense mutation","Silent mutation","Missense mutation"], a:2, ex:"Because the genetic code is degenerate, some base changes don't change the resulting amino acid — a silent mutation."},
    {q:"Deleting a single nucleotide near the start of a gene's coding sequence would most likely cause:", c:["No effect at all","A frameshift, altering every downstream codon","A silent mutation only","Faster transcription"], a:1, ex:"A 1-base deletion shifts the reading frame for all codons downstream of the deletion, usually producing a nonfunctional protein."},
    {q:"During translation, which molecule physically matches an mRNA codon to the correct amino acid?", c:["DNA polymerase","rRNA alone","tRNA, via its anticodon","RNA polymerase"], a:2, ex:"Each tRNA carries a specific amino acid and has an anticodon that base-pairs with the complementary mRNA codon."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 15, Genes and Proteins"]
},

"gene-regulation": {
  simple: "Cells turn genes on and off so that, despite sharing the same DNA, a liver cell and a neuron end up looking and acting completely differently.",
  highYield: [
    "Promoter: DNA region where RNA polymerase binds to start transcription of a gene.",
    "Operon (prokaryotes, e.g., lac operon): a cluster of genes controlled by one promoter/operator, turned on or off together.",
    "Repressors block transcription by binding the operator; activators/transcription factors boost RNA polymerase binding at the promoter.",
    "Enhancers/silencers: DNA regions, often far from the gene, that increase or decrease transcription when bound by regulatory proteins.",
    "Epigenetics: heritable changes in gene expression without changing the DNA sequence itself — e.g., DNA methylation (usually silences genes) and histone acetylation (usually activates genes by loosening chromatin).",
    "X-inactivation: one X chromosome in each female cell is randomly silenced (Barr body) to balance gene dosage with males."
  ],
  mechanism: "Tightly packed chromatin (heterochromatin) is generally inaccessible to transcription machinery, while loosely packed chromatin (euchromatin) is accessible. Histone acetylation neutralizes the positive charge on histones, loosening their grip on negatively charged DNA and opening chromatin for transcription; DNA methylation (usually at promoter CpG islands) recruits proteins that compact chromatin and block transcription factor binding. This is how the same genome produces hundreds of different cell types.",
  diseaseConnection: [
    "Abnormal hypermethylation can silence tumor-suppressor genes, contributing to cancer even without a DNA sequence mutation.",
    "Imprinting disorders (e.g., Prader-Willi/Angelman syndromes) occur when the epigenetic 'parent of origin' silencing pattern on chromosome 15 is disrupted."
  ],
  traps: [
    "Epigenetic changes affect gene expression, NOT the underlying DNA sequence — don't confuse with mutation.",
    "DNA methylation typically silences/represses; histone acetylation typically activates — these are easy to swap by mistake.",
    "A repressor binds the operator to block transcription; this is different from a transcription factor that's an activator boosting RNA polymerase binding."
  ],
  quiz: [
    {q:"Two cells in the same person have identical DNA sequences but express very different sets of genes. This is best explained by:", c:["One cell has mutated DNA","Differential gene regulation/epigenetics","Different genetic codes","Different numbers of chromosomes"], a:1, ex:"Differentiated cell types arise from differential gene expression (epigenetic and regulatory), not differences in the DNA sequence itself."},
    {q:"Increased histone acetylation at a gene's promoter would most likely:", c:["Silence the gene permanently","Increase transcription of that gene","Delete the gene","Cause a frameshift mutation"], a:1, ex:"Acetylation loosens histone-DNA binding, opening chromatin and generally promoting transcription."},
    {q:"In the lac operon, when lactose is absent, the repressor protein:", c:["Binds the operator and blocks transcription","Is destroyed permanently","Activates RNA polymerase directly","Methylates the promoter"], a:0, ex:"Without lactose (the inducer), the repressor binds the operator and physically blocks RNA polymerase, keeping the operon off."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 16, Gene Expression", "OpenStax Biology 2e — Ch. 17, Biotechnology and Genomics (epigenetics)"]
},

"mendelian-genetics": {
  simple: "Mendelian genetics describes how single-gene traits are passed from parents to offspring in predictable ratios.",
  highYield: [
    "Dominant allele (capital letter) masks a recessive allele (lowercase) in a heterozygote.",
    "Law of segregation: the two alleles for a gene separate into different gametes.",
    "Law of independent assortment: alleles of different genes (on different chromosomes) sort into gametes independently of each other.",
    "Monohybrid cross (Aa × Aa) → classic 3:1 phenotype ratio in offspring.",
    "Dihybrid cross (AaBb × AaBb) → classic 9:3:3:1 phenotype ratio, assuming independent assortment.",
    "Incomplete dominance: heterozygote shows a blended/intermediate phenotype (e.g., red x white flower → pink).",
    "Codominance: both alleles are fully expressed at once (e.g., AB blood type).",
    "X-linked recessive traits (e.g., red-green colorblindness, hemophilia) appear far more often in males, since they have only one X."
  ],
  mechanism: "Because each parent contributes one allele per gene, predictable ratios emerge purely from probability: a Punnett square is just a visual tool for combining the probabilities of each parent's gametes. Pedigree analysis works backward from these same rules — for example, an affected child from two unaffected parents strongly suggests a recessive trait, since both parents must be heterozygous carriers.",
  diseaseConnection: [
    "Cystic fibrosis, sickle cell anemia, Tay-Sachs: classic autosomal recessive single-gene disorders.",
    "Huntington's disease: classic autosomal dominant disorder — only one copy of the mutant allele is needed to cause disease."
  ],
  traps: [
    "Incomplete dominance (blended phenotype) is NOT the same as codominance (both alleles fully, separately visible) — a frequent exam confusion.",
    "A recessive disease skipping a generation strongly suggests carriers, not that the gene 'disappeared.'",
    "X-linked recessive disorders affect males far more often because they have only one X chromosome (no second allele to mask it)."
  ],
  quiz: [
    {q:"Two parents with type A and type B blood have a child with type AB blood. This best illustrates:", c:["Incomplete dominance","Codominance","Recessive epistasis","X-linkage"], a:1, ex:"In ABO blood typing, the A and B alleles are codominant — both are fully expressed on red blood cells simultaneously."},
    {q:"A cross between two heterozygous pea plants (Aa x Aa) for a simple dominant/recessive trait is expected to produce offspring in what phenotypic ratio?", c:["1:1","9:3:3:1","3:1","1:2:1"], a:2, ex:"A monohybrid Aa x Aa cross yields 1 AA : 2 Aa : 1 aa genotypically, which is 3 dominant : 1 recessive phenotypically."},
    {q:"A recessive disorder appears in a son but neither parent is affected. The most likely explanation is:", c:["Both parents are unaffected carriers (heterozygous)","The trait is dominant","A new mutation must have occurred","The disorder is X-linked dominant"], a:0, ex:"For an autosomal recessive trait, two unaffected heterozygous (carrier) parents can have an affected child with a 25% chance per pregnancy."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 12, Mendel's Experiments and Heredity"]
},

"chromosomal-genetics": {
  simple: "Beyond single-gene mutations, whole chromosomes can be duplicated, deleted, rearranged, or miscounted — these larger-scale changes often have bigger effects than a single mutated gene.",
  highYield: [
    "Aneuploidy: an abnormal chromosome number from nondisjunction, e.g., trisomy 21 (Down syndrome), Klinefelter (XXY), Turner (XO).",
    "Deletion: a chromosome segment is lost (e.g., Cri-du-chat syndrome, deletion on chromosome 5).",
    "Duplication: a chromosome segment is repeated.",
    "Inversion: a segment is flipped end to end within the chromosome.",
    "Translocation: a segment breaks off and attaches to a different, non-homologous chromosome (e.g., Philadelphia chromosome in chronic myeloid leukemia).",
    "Karyotype: an image of an individual's full chromosome set, used to detect number and structural abnormalities.",
    "Genetic counseling/screening: karyotyping, amniocentesis, and chorionic villus sampling can detect chromosomal abnormalities prenatally."
  ],
  mechanism: "Most structural chromosomal abnormalities arise from errors during crossing over or chromosome segregation in meiosis: chromosomes can break and rejoin incorrectly (deletion, duplication, inversion, translocation), or homologous chromosomes/sister chromatids can fail to separate properly (nondisjunction), leaving one gamete with an extra chromosome and another with one missing.",
  diseaseConnection: [
    "Down syndrome (trisomy 21): extra copy of chromosome 21, the most common live-born aneuploidy.",
    "Chronic myeloid leukemia: reciprocal translocation between chromosomes 9 and 22 creates the BCR-ABL fusion gene (Philadelphia chromosome), driving uncontrolled white blood cell growth."
  ],
  traps: [
    "A 'mutation' isn't only a single base change — large chromosomal changes (deletions, translocations, aneuploidy) are also mutations and are often more clinically severe.",
    "Translocation moves DNA between non-homologous chromosomes; this is different from crossing over, which exchanges DNA between homologous chromosomes.",
    "Down syndrome is most often caused by nondisjunction in meiosis, not by an inherited mutation from a carrier parent (though a rarer translocation form can be inherited)."
  ],
  quiz: [
    {q:"A patient's leukemia cells show a piece of chromosome 9 attached to chromosome 22. This structural abnormality is called a:", c:["Deletion","Inversion","Translocation","Duplication"], a:2, ex:"A segment moving to a non-homologous chromosome is a translocation; this specific one is the Philadelphia chromosome seen in chronic myeloid leukemia."},
    {q:"Down syndrome most commonly results from:", c:["A single gene point mutation","Nondisjunction causing trisomy 21","X-inactivation failure","A chromosomal inversion"], a:1, ex:"Down syndrome is most commonly caused by nondisjunction during meiosis, producing an extra copy of chromosome 21."},
    {q:"A karyotype is best described as a tool used to detect:", c:["Single nucleotide mutations only","Chromosome number and large structural abnormalities","Epigenetic methylation patterns","Codon usage bias"], a:1, ex:"Karyotyping images and counts the full chromosome set, revealing aneuploidy and large structural rearrangements, but not single-base mutations."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 13/15, Chromosomal Basis of Inheritance"]
},

"biotech": {
  simple: "Modern biology relies on a toolkit of lab techniques to read, cut, copy, and compare DNA.",
  highYield: [
    "PCR (polymerase chain reaction): amplifies a specific DNA sequence into millions of copies using primers, DNA polymerase, and repeated heat cycles.",
    "Gel electrophoresis: separates DNA fragments by size — smaller fragments migrate farther through the gel toward the positive electrode.",
    "Restriction enzymes: bacterial proteins that cut DNA at specific recognition sequences, used to cut and paste DNA fragments.",
    "Recombinant DNA: combining DNA from different sources, e.g., inserting a human gene into a bacterial plasmid to mass-produce a protein (recombinant insulin).",
    "DNA sequencing: determines the exact order of nucleotides in a DNA sample.",
    "CRISPR-Cas9: a programmable 'molecular scissors' system that uses a guide RNA to direct the Cas9 enzyme to cut DNA at a specific sequence, enabling precise gene editing.",
    "DNA fingerprinting: uses variable-length DNA regions (compared via gel electrophoresis) to identify individuals, e.g., in forensics or paternity testing."
  ],
  mechanism: "PCR mimics natural DNA replication in a test tube: heating separates the double helix, primers bind the target sequence, and a heat-stable DNA polymerase (Taq polymerase) extends new strands — repeating this cycle ~20-30 times doubles the DNA each round, turning a trace sample into a usable quantity. CRISPR-Cas9 borrows a bacterial immune defense system: a guide RNA base-pairs with a complementary DNA target, directing Cas9 to cut both strands there, which the cell then repairs (often allowing a new sequence to be inserted).",
  diseaseConnection: [
    "PCR-based tests are used to rapidly detect pathogen DNA/RNA (e.g., viral infections) at very low starting concentrations.",
    "CRISPR gene editing is being explored as a treatment for single-gene disorders like sickle cell anemia, by correcting the causative mutation directly."
  ],
  traps: [
    "In gel electrophoresis, SMALLER fragments travel FARTHER (faster through the gel matrix) — a commonly reversed fact.",
    "PCR amplifies a target sequence; it does not 'sequence' the DNA by itself — sequencing is a separate technique.",
    "Restriction enzymes cut DNA at specific sequences; they are not the same as DNA polymerase, which builds new DNA strands."
  ],
  quiz: [
    {q:"On a gel electrophoresis image, the smallest DNA fragments will be found:", c:["Closest to the wells (starting point)","Farthest from the wells (traveled the most)","Exactly in the middle regardless of size","Outside the gel"], a:1, ex:"Smaller fragments move more easily through the gel matrix and travel farther in a given time than larger fragments."},
    {q:"CRISPR-Cas9 achieves precise, targeted DNA cutting primarily through:", c:["Random chemical cleavage","A guide RNA that base-pairs with the target DNA sequence","Heat-induced strand separation","A restriction enzyme recognition site only"], a:1, ex:"The guide RNA is complementary to the target sequence and directs the Cas9 enzyme to cut at that specific location."},
    {q:"Which step is essential for PCR to exponentially amplify a target DNA sequence?", c:["Restriction enzyme digestion","Repeated cycles of heating and cooling with primers and heat-stable polymerase","Gel electrophoresis","CRISPR guide RNA"], a:1, ex:"PCR relies on repeated denature-anneal-extend cycles using primers and a heat-stable polymerase (e.g., Taq) to double the DNA each cycle."}
  ],
  refs: ["OpenStax Biology 2e — Ch. 17, Biotechnology and Genomics"]
},

"physio-cardio": {
  simple: "The cardiovascular system pumps oxygen and nutrients to every cell and carries waste away, using the heart as a dual pump.",
  highYield: [
    "Pulmonary circuit: right ventricle → pulmonary artery → lungs (pick up O2, drop CO2) → pulmonary vein → left atrium.",
    "Systemic circuit: left ventricle → aorta → body → vena cava → right atrium.",
    "SA node ('pacemaker') in the right atrium sets heart rate; signal passes to AV node, then the Bundle of His and Purkinje fibers to trigger ventricular contraction.",
    "Cardiac cycle: systole = chambers contracting/ejecting blood; diastole = chambers relaxed/filling.",
    "Blood pressure is recorded as systolic/diastolic (e.g., 120/80 mmHg); normal resting heart rate ~60-100 bpm.",
    "Arteries carry blood away from the heart (thick, elastic walls, high pressure); veins carry blood back (thinner walls, valves to prevent backflow, low pressure); capillaries are the single-cell-thick site of nutrient/gas exchange.",
    "Cardiac output = heart rate x stroke volume — the total blood pumped per minute."
  ],
  mechanism: "The SA node generates an electrical signal automatically (no nervous input needed to start a beat) that spreads across the atria, causing them to contract and push blood into the ventricles. The AV node briefly delays the signal so the ventricles finish filling before the Bundle of His/Purkinje fibers spread the signal through the ventricular walls, triggering a coordinated, bottom-up squeeze that ejects blood efficiently into the arteries.",
  diseaseConnection: [
    "Atherosclerosis narrows coronary arteries, reducing blood flow to heart muscle and setting up myocardial infarction.",
    "Damage to the SA or AV node disrupts the timing of the cardiac cycle, causing arrhythmias or heart block."
  ],
  traps: [
    "The right side of the heart pumps to the LUNGS (pulmonary), not the body — the left side pumps to the body (systemic). A very common reversal.",
    "Pulmonary arteries carry deoxygenated blood (artery just means 'away from heart'), and pulmonary veins carry oxygenated blood — artery/vein names refer to direction, not oxygen content.",
    "The SA node sets HR intrinsically; the nervous system only speeds up or slows it down, it doesn't start each beat."
  ],
  quiz: [
    {q:"Which vessel carries deoxygenated blood?", c:["Pulmonary vein","Aorta","Pulmonary artery","Systemic capillaries delivering O2"], a:2, ex:"The pulmonary artery carries deoxygenated blood from the right ventricle to the lungs — 'artery' refers to direction from the heart, not oxygen content."},
    {q:"The electrical impulse that normally initiates each heartbeat originates in the:", c:["AV node","SA node","Bundle of His","Purkinje fibers"], a:1, ex:"The SA node is the heart's natural pacemaker, located in the right atrium."},
    {q:"During ventricular systole, which of the following is true?", c:["Ventricles are relaxing and filling","Ventricles are contracting and ejecting blood","The AV valves are wide open","Blood is flowing backward into the atria"], a:1, ex:"Systole refers to the contraction phase, during which the ventricles eject blood into the arteries."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 19-20, Cardiovascular System"]
},

"physio-resp": {
  simple: "The respiratory system brings oxygen into the blood and removes carbon dioxide, working closely with the cardiovascular system.",
  highYield: [
    "Air path: nose/mouth → pharynx → larynx → trachea → bronchi → bronchioles → alveoli (site of gas exchange).",
    "Alveoli are surrounded by capillaries; their thin, moist, single-cell walls allow O2 and CO2 to diffuse rapidly down their gradients.",
    "Inspiration: diaphragm contracts and flattens, chest cavity volume increases, pressure drops below atmospheric, air flows in.",
    "Expiration (quiet breathing): diaphragm relaxes, chest cavity volume decreases, pressure rises, air flows out — usually passive.",
    "Most O2 is transported bound to hemoglobin in red blood cells; most CO2 is transported as bicarbonate ion dissolved in plasma.",
    "The medulla oblongata sets the basic breathing rhythm, primarily responding to blood CO2/pH levels (not blood O2 levels, under normal conditions)."
  ],
  mechanism: "Breathing works by pressure differences created through volume changes (Boyle's Law: pressure and volume are inversely related). Gas exchange itself needs no muscular effort — O2 and CO2 simply diffuse down their concentration gradients across the thin alveolar-capillary membrane. The brainstem monitors blood CO2 (via pH/carbonic acid changes in cerebrospinal fluid) far more closely than O2 to control breathing rate, which is why CO2 retention, not low O2, is usually the first trigger to breathe more.",
  diseaseConnection: [
    "Asthma: bronchiole smooth muscle constriction and inflammation narrow airways, increasing resistance to airflow.",
    "Emphysema (a form of COPD): alveolar walls break down, reducing surface area for gas exchange and trapping air."
  ],
  traps: [
    "Normal breathing is primarily driven by blood CO2/pH levels, not low O2 — only in some chronic lung disease patients does low O2 become the main drive.",
    "Quiet expiration is passive (elastic recoil), not muscle-powered; forced expiration (e.g., exercise) does use muscles (e.g., abdominals, internal intercostals).",
    "Gas exchange at the alveoli is passive diffusion — no transport protein or ATP required."
  ],
  quiz: [
    {q:"Under normal conditions, breathing rate is primarily regulated by blood levels of:", c:["Oxygen","Carbon dioxide (via pH)","Glucose","Hemoglobin"], a:1, ex:"The medulla oblongata responds mainly to CO2-driven changes in blood/CSF pH to set breathing rate."},
    {q:"During inhalation, the diaphragm:", c:["Relaxes and domes upward","Contracts and flattens, increasing chest cavity volume","Stops moving entirely","Pushes air out of the lungs"], a:1, ex:"Diaphragm contraction flattens it, expanding the thoracic cavity and dropping internal pressure so air flows in."},
    {q:"Gas exchange at the alveoli occurs via:", c:["Active transport requiring ATP","Simple diffusion down concentration gradients","Facilitated diffusion through channel proteins","Bulk flow through vesicles"], a:1, ex:"O2 and CO2 cross the thin alveolar-capillary membrane by simple diffusion, moving from high to low concentration."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 22, Respiratory System"]
},

"physio-nervous": {
  simple: "The nervous system is the body's fast electrical communication network, made of neurons that send signals and process information.",
  highYield: [
    "CNS (central nervous system) = brain + spinal cord; PNS (peripheral) = all nerves outside the CNS.",
    "PNS divides into somatic (voluntary, skeletal muscle) and autonomic (involuntary; sympathetic 'fight or flight' vs. parasympathetic 'rest and digest').",
    "Resting membrane potential (~ -70mV) is maintained by the Na+/K+ pump and selective ion permeability (more K+ leak channels than Na+).",
    "Action potential: depolarization (Na+ channels open, Na+ rushes in) → repolarization (K+ channels open, K+ rushes out) → brief hyperpolarization, then reset.",
    "Action potentials are 'all-or-none' — they either fire at full strength or not at all; intensity of stimulus is encoded by frequency of firing, not size of the signal.",
    "Synapse: electrical signal triggers neurotransmitter release from the presynaptic neuron, which crosses the synaptic cleft and binds receptors on the postsynaptic neuron.",
    "Myelin sheath (made by Schwann cells in PNS, oligodendrocytes in CNS) speeds conduction via saltatory conduction (signal 'jumps' between Nodes of Ranvier)."
  ],
  mechanism: "A stimulus that depolarizes a neuron past threshold triggers voltage-gated Na+ channels to open, causing a rapid, self-reinforcing influx of Na+ (depolarization). Voltage-gated K+ channels then open and Na+ channels inactivate, restoring negative charge (repolarization). Because each action potential is identical in size, neurons communicate the strength of a stimulus by how frequently they fire, not by varying the size of each spike.",
  diseaseConnection: [
    "Multiple sclerosis: immune attack on myelin slows or blocks nerve conduction, causing varied neurological symptoms.",
    "Myasthenia gravis: antibodies block acetylcholine receptors at the neuromuscular junction, causing muscle weakness."
  ],
  traps: [
    "Action potentials are all-or-none; a stronger stimulus increases firing FREQUENCY, not the size of each individual action potential.",
    "Depolarization is caused by Na+ influx; repolarization is caused by K+ efflux — these are commonly swapped.",
    "Sympathetic = fight or flight (increases heart rate); parasympathetic = rest and digest (decreases heart rate) — easy to mix up under exam pressure."
  ],
  quiz: [
    {q:"A stronger sensory stimulus is encoded by the nervous system mainly through:", c:["A larger action potential","A higher frequency of action potentials","A longer-lasting resting potential","Reduced neurotransmitter release"], a:1, ex:"Since action potentials are all-or-none, stimulus intensity is conveyed by firing frequency, not amplitude."},
    {q:"During the depolarization phase of an action potential, which ion movement occurs?", c:["K+ flows out of the neuron","Na+ flows into the neuron","Cl- flows into the neuron","Ca2+ flows out of the neuron"], a:1, ex:"Voltage-gated Na+ channels open, and Na+ rushes into the cell, making the inside more positive (depolarization)."},
    {q:"Activation of the parasympathetic nervous system would most likely cause:", c:["Increased heart rate and pupil dilation","Decreased heart rate and increased digestive activity","Release of adrenaline from the adrenal medulla","Bronchodilation for increased oxygen intake"], a:1, ex:"Parasympathetic activity promotes 'rest and digest' functions: slower heart rate, increased digestion."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 12-15, Nervous System"]
},

"physio-endocrine": {
  simple: "The endocrine system uses hormones released into the blood to send slower, longer-lasting signals than the nervous system, regulating things like metabolism, growth, and blood sugar.",
  highYield: [
    "Hypothalamus controls the pituitary gland ('master gland'), which in turn controls many other endocrine glands — this is the hypothalamic-pituitary axis.",
    "Negative feedback is the dominant control pattern: rising hormone/product levels suppress further release (e.g., high blood glucose triggers insulin, which lowers glucose, which then reduces insulin release).",
    "Insulin (beta cells, pancreas) lowers blood glucose by promoting cellular uptake and storage as glycogen; glucagon (alpha cells) raises blood glucose by promoting glycogen breakdown.",
    "Thyroid hormone (T3/T4) sets the body's baseline metabolic rate; regulated by TSH from the pituitary.",
    "Adrenal medulla releases epinephrine/norepinephrine for fast 'fight or flight' response; adrenal cortex releases cortisol (stress, blood sugar) and aldosterone (sodium/water balance).",
    "Steroid hormones (lipid-soluble, e.g., cortisol, sex hormones) diffuse through the cell membrane and bind intracellular receptors; peptide hormones (e.g., insulin) bind surface receptors."
  ],
  mechanism: "Most hormone systems are governed by negative feedback loops: a gland releases a hormone, that hormone produces an effect, and the resulting change (e.g., normalized blood glucose, normalized hormone level) feeds back to shut off further release. This keeps levels within a stable range without requiring constant conscious control. The hypothalamic-pituitary axis adds another tier — the hypothalamus releases factors that tell the pituitary to release its own hormones, which then act on peripheral glands, and hormones from those glands feed back to suppress both the hypothalamus and pituitary.",
  diseaseConnection: [
    "Type 1 diabetes: autoimmune destruction of insulin-producing beta cells, so blood glucose can no longer be lowered effectively.",
    "Graves' disease: autoantibodies mimic TSH, continuously over-stimulating the thyroid (hyperthyroidism), overriding normal negative feedback."
  ],
  traps: [
    "Insulin LOWERS blood glucose; glucagon RAISES it — frequently reversed under exam pressure.",
    "Most endocrine regulation is negative feedback (self-limiting); positive feedback loops (e.g., childbirth contractions) are the rare exception, not the rule.",
    "Steroid hormones use intracellular receptors and typically act over a slower timescale via gene transcription, unlike fast peptide-hormone signaling at the cell surface."
  ],
  quiz: [
    {q:"After a carbohydrate-rich meal, which hormone change would be expected?", c:["Increased glucagon, decreased insulin","Increased insulin, decreased glucagon","Both insulin and glucagon increase equally","Neither hormone changes"], a:1, ex:"Rising blood glucose stimulates insulin release (to lower glucose) and suppresses glucagon (which would raise it further)."},
    {q:"Most hormonal regulation in the body relies primarily on:", c:["Positive feedback loops","Negative feedback loops","Random hormone release","Action potentials"], a:1, ex:"Negative feedback is the dominant regulatory pattern, keeping hormone and product levels within a stable range."},
    {q:"A hormone that diffuses directly through the cell membrane and binds a receptor inside the cell is most likely:", c:["Insulin","A steroid hormone such as cortisol","A peptide hormone","Epinephrine"], a:1, ex:"Lipid-soluble steroid hormones cross the membrane directly and act on intracellular receptors, often regulating gene transcription."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 17, Endocrine System"]
},

"physio-digestive": {
  simple: "The digestive system breaks food down mechanically and chemically into small molecules that can be absorbed into the bloodstream.",
  highYield: [
    "Path: mouth (mechanical + salivary amylase starts starch digestion) → esophagus → stomach (pepsin + HCl digest protein) → small intestine (main site of digestion and absorption) → large intestine (water absorption, microbiome) → rectum/anus.",
    "Pancreas releases digestive enzymes (amylase, lipase, proteases) and bicarbonate into the small intestine to neutralize stomach acid.",
    "Liver produces bile (stored in the gallbladder), which emulsifies fats, increasing surface area for lipase to act.",
    "Small intestine's lining is covered in villi and microvilli, vastly increasing surface area for nutrient absorption.",
    "Carbohydrates are broken down to monosaccharides, proteins to amino acids, and fats to fatty acids/glycerol before absorption.",
    "Most nutrient absorption happens in the small intestine; the large intestine mainly reabsorbs water and houses beneficial gut bacteria."
  ],
  mechanism: "Digestion is both mechanical (chewing, stomach churning, segmentation in the intestine) and chemical (enzymes progressively breaking macromolecules into absorbable subunits). The stomach's strongly acidic environment (pH ~1.5-3.5) activates pepsin and kills many ingested pathogens, but this acid must be neutralized by pancreatic bicarbonate before reaching the small intestine, since intestinal enzymes work best near neutral pH.",
  diseaseConnection: [
    "Peptic ulcer disease: H. pylori infection or NSAID overuse erodes the protective mucous lining, allowing acid to damage the stomach/duodenal wall.",
    "Celiac disease: immune reaction to gluten damages small intestinal villi, impairing nutrient absorption."
  ],
  traps: [
    "Most digestion AND absorption happens in the small intestine, not the stomach — the stomach mainly starts protein digestion and stores/churns food.",
    "Bile does not chemically digest fat — it physically emulsifies it (increases surface area); lipase is the actual digestive enzyme.",
    "The large intestine's main job is water/electrolyte reabsorption, not nutrient digestion."
  ],
  quiz: [
    {q:"Where does the majority of nutrient digestion and absorption occur?", c:["Stomach","Small intestine","Large intestine","Esophagus"], a:1, ex:"The small intestine, with its villi/microvilli, is the primary site for both chemical digestion completion and nutrient absorption."},
    {q:"Bile's primary role in fat digestion is to:", c:["Chemically break ester bonds in triglycerides","Emulsify fats, increasing surface area for lipase","Neutralize stomach acid","Digest proteins"], a:1, ex:"Bile physically emulsifies large fat globules into smaller droplets, which lipase can then act on more efficiently — it is not itself an enzyme."},
    {q:"Pancreatic bicarbonate secretion into the small intestine primarily serves to:", c:["Digest starches","Neutralize acidic chyme from the stomach","Absorb water","Kill bacteria"], a:1, ex:"Bicarbonate raises the pH of the highly acidic stomach contents so intestinal enzymes (which work best near neutral pH) can function."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 23, Digestive System"]
},

"physio-renal": {
  simple: "The kidneys filter blood to remove waste and excess substances while precisely balancing water, electrolytes, and blood pressure.",
  highYield: [
    "Functional unit = nephron; each kidney has roughly a million nephrons.",
    "Three core processes: filtration (glomerulus, non-selective by size, pushes plasma/small solutes into Bowman's capsule), reabsorption (useful substances like glucose, water, ions return to blood, mainly in the proximal tubule), secretion (additional waste actively added into the tubule).",
    "Glucose and amino acids are normally fully reabsorbed — glucose in the urine (glycosuria) signals blood glucose has exceeded the kidney's reabsorption capacity (classic in uncontrolled diabetes).",
    "Antidiuretic hormone (ADH) increases water reabsorption in the collecting duct, concentrating urine when the body needs to conserve water.",
    "Aldosterone increases sodium (and water) reabsorption and potassium secretion in the distal tubule/collecting duct, raising blood volume and pressure.",
    "Final urine travels from the collecting ducts to the ureters, bladder, and urethra for elimination."
  ],
  mechanism: "Blood pressure forces plasma (not cells or large proteins) out of the glomerular capillaries into Bowman's capsule, creating a filtrate. As this filtrate flows down the nephron tubule, the body selectively reclaims what it needs (water, glucose, ions) back into the surrounding capillaries (reabsorption) while actively dumping additional wastes into the tubule (secretion) — what's left becomes urine. Hormones like ADH and aldosterone fine-tune this process by adjusting how much water and sodium are reabsorbed, directly tuning blood volume and pressure.",
  diseaseConnection: [
    "Chronic kidney disease: progressive nephron loss reduces filtration capacity, allowing waste products (e.g., creatinine, urea) to build up in blood.",
    "Diabetic nephropathy: chronically high blood glucose damages glomerular capillaries over time, a leading cause of kidney failure."
  ],
  traps: [
    "Glomerular filtration is based on size/charge, not selective for 'good vs bad' molecules — useful small molecules like glucose are filtered out and must be actively reabsorbed.",
    "ADH affects water reabsorption; aldosterone affects sodium/potassium balance — distinct hormones often confused.",
    "Glycosuria means blood glucose exceeded the kidney's reabsorption threshold, not that the kidneys are 'making' glucose."
  ],
  quiz: [
    {q:"Glucose appearing in the urine (glycosuria) most directly indicates:", c:["The kidneys are producing extra glucose","Blood glucose exceeded the nephron's reabsorption capacity","ADH levels are too high","The bladder is infected"], a:1, ex:"Normally all filtered glucose is reabsorbed; glycosuria occurs when blood glucose is so high that the tubule's reabsorption capacity is exceeded, as in uncontrolled diabetes."},
    {q:"Increased ADH (antidiuretic hormone) release would result in:", c:["More dilute, higher-volume urine","More concentrated, lower-volume urine","Increased sodium excretion only","Decreased blood pressure"], a:1, ex:"ADH increases water reabsorption in the collecting duct, conserving water and concentrating the urine."},
    {q:"Which renal process moves substances directly from the blood into the nephron tubule after filtration has already occurred?", c:["Filtration","Reabsorption","Secretion","Excretion"], a:2, ex:"Secretion is the active addition of additional solutes (e.g., H+, K+, drugs) from peritubular capillaries into the tubule, separate from the initial filtration step."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 25, Urinary System"]
},

"physio-immune": {
  simple: "The immune system defends the body against pathogens using a fast, general-purpose first line of defense and a slower, highly specific second line.",
  highYield: [
    "Innate immunity: fast, non-specific, present from birth — physical barriers (skin, mucus), phagocytes (neutrophils, macrophages), inflammation, fever, complement proteins, natural killer cells.",
    "Adaptive immunity: slower to start, highly specific, improves with repeated exposure (immunological memory) — driven by B cells and T cells.",
    "B cells mature in bone marrow, differentiate into plasma cells that secrete antibodies (humoral immunity) targeting extracellular pathogens.",
    "T cells mature in the thymus; helper T cells (CD4+) coordinate the immune response, cytotoxic T cells (CD8+) directly kill infected/cancerous cells (cell-mediated immunity).",
    "Antibodies (immunoglobulins) bind specific antigens, marking pathogens for destruction or neutralizing them directly.",
    "Memory cells persist after an infection/vaccination, allowing a faster, stronger response on re-exposure to the same antigen — the basis of vaccination.",
    "Inflammation (redness, heat, swelling, pain) results from increased blood flow and vessel permeability, helping immune cells reach the site of infection/injury."
  ],
  mechanism: "On first exposure to a new pathogen, adaptive immunity takes roughly 1-2 weeks to mount a full response, because rare B and T cells specific to that exact antigen must first be found and clonally expanded. Memory cells generated during this primary response persist long-term; on a second exposure to the same antigen, these pre-existing memory cells allow a much faster and stronger secondary response, often preventing illness entirely. Vaccines exploit this by safely exposing the immune system to an antigen (without causing disease) to generate memory cells in advance.",
  diseaseConnection: [
    "HIV destroys helper T cells (CD4+), progressively crippling the adaptive immune response and leading to AIDS.",
    "Autoimmune diseases (e.g., lupus, type 1 diabetes) occur when the adaptive immune system mistakenly targets the body's own cells/tissues as if they were foreign."
  ],
  traps: [
    "Innate immunity is fast but non-specific; adaptive immunity is slow (first exposure) but highly specific and has memory — don't mix up speed with specificity.",
    "B cells handle humoral immunity (antibodies, extracellular pathogens); T cells handle cell-mediated immunity (intracellular pathogens, infected/cancer cells).",
    "A second exposure to the same pathogen triggers a faster, stronger response because of memory cells, not because the innate immune system has 'learned.'"
  ],
  quiz: [
    {q:"Which best describes innate immunity?", c:["Slow, highly specific, has memory","Fast, non-specific, present from birth","Mediated only by antibodies","Requires prior exposure to function"], a:1, ex:"Innate immunity is the rapid, generic first line of defense (skin, phagocytes, inflammation) that doesn't require prior exposure."},
    {q:"A vaccine works primarily by:", c:["Directly killing pathogens already in the body","Generating memory B and T cells in advance of real infection","Boosting innate immunity permanently","Replacing the need for an immune system"], a:1, ex:"Vaccines expose the immune system to a safe form of an antigen, generating memory cells that allow a fast, strong response if the real pathogen is encountered later."},
    {q:"HIV primarily damages the immune system by infecting and destroying:", c:["Red blood cells","Helper T cells (CD4+)","Skin cells","B cells directly and exclusively"], a:1, ex:"HIV targets CD4+ helper T cells, which coordinate much of the adaptive immune response; their loss cripples both humoral and cell-mediated immunity."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 21, Immune System"]
},

"physio-musculo": {
  simple: "The musculoskeletal system gives the body structure and produces movement through bones, joints, and muscles working together.",
  highYield: [
    "Skeletal muscle is striated and voluntary; cardiac muscle is striated and involuntary; smooth muscle is non-striated and involuntary (lines organs/vessels).",
    "Sliding filament theory: muscle contraction occurs as thin (actin) filaments slide past thick (myosin) filaments, shortening the sarcomere — filament lengths themselves don't change.",
    "Calcium ions, released from the sarcoplasmic reticulum, bind troponin, shifting tropomyosin off actin's myosin-binding sites and allowing cross-bridge cycling.",
    "ATP is required both to power the myosin power stroke and to release myosin from actin (rigor mortis occurs when ATP runs out and muscles lock in a contracted state).",
    "Bone is living tissue, constantly remodeled by osteoblasts (build bone) and osteoclasts (break down bone); calcium balance is regulated partly by parathyroid hormone.",
    "Joints: synovial joints (e.g., knee, shoulder) allow free movement and are cushioned by cartilage and synovial fluid."
  ],
  mechanism: "A motor neuron releases acetylcholine at the neuromuscular junction, triggering an action potential in the muscle fiber that spreads via T-tubules and causes the sarcoplasmic reticulum to release stored calcium. Calcium binding to troponin exposes myosin-binding sites on actin, allowing myosin heads to repeatedly bind, pull (power stroke using ATP), and release actin filaments — this 'ratcheting' progressively shortens the sarcomere and produces contraction. Without ATP, myosin cannot detach from actin, which is why a contracted muscle without ATP stays locked (rigor mortis).",
  diseaseConnection: [
    "Duchenne muscular dystrophy: defective dystrophin protein leaves muscle fibers fragile, leading to progressive muscle breakdown.",
    "Myasthenia gravis: antibodies block acetylcholine receptors at the neuromuscular junction, weakening the signal to contract."
  ],
  traps: [
    "During contraction, the actin and myosin filaments themselves do NOT shorten — they slide past each other, shortening the sarcomere as a whole.",
    "ATP is needed for myosin to RELEASE actin, not just to contract — this is why muscles stay rigid after death (rigor mortis) once ATP is depleted.",
    "Osteoblasts BUILD bone, osteoclasts BREAK DOWN bone — commonly swapped due to similar-sounding names."
  ],
  quiz: [
    {q:"According to the sliding filament theory, muscle contraction occurs because:", c:["Actin and myosin filaments themselves shorten","Actin filaments slide past myosin filaments, shortening the sarcomere","Myosin filaments are destroyed","Calcium shortens the muscle directly"], a:1, ex:"The filaments themselves stay the same length; they slide past one another, shortening the sarcomere and the muscle overall."},
    {q:"Rigor mortis (muscle stiffening after death) occurs because:", c:["Calcium floods out of all cells immediately","ATP is depleted, so myosin cannot release actin","Muscles lose all their actin","Acetylcholine is overproduced"], a:1, ex:"ATP is required for the myosin head to detach from actin; without ATP after death, the cross-bridges remain locked, causing stiffness."},
    {q:"Which cell type is primarily responsible for breaking down bone tissue?", c:["Osteoblasts","Osteocytes","Osteoclasts","Chondrocytes"], a:2, ex:"Osteoclasts resorb (break down) bone tissue, while osteoblasts build new bone — together they balance bone remodeling."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 6 & 10, Bone and Muscle Tissue"]
},

"physio-reproductive": {
  simple: "The reproductive system produces gametes and supports the hormonal cycles and processes needed for reproduction.",
  highYield: [
    "Male: testes produce sperm (spermatogenesis) and testosterone; sperm matures in the epididymis before ejaculation.",
    "Female: ovaries produce eggs (oogenesis) and the hormones estrogen and progesterone; one egg is typically released per menstrual cycle (ovulation).",
    "Menstrual cycle is governed by a feedback loop: hypothalamus (GnRH) → pituitary (FSH, LH) → ovaries (estrogen, progesterone), with a mid-cycle LH surge triggering ovulation.",
    "Estrogen drives the build-up of the uterine lining (endometrium); progesterone maintains it to support a potential pregnancy; if no fertilization occurs, hormone levels drop and the lining sheds (menstruation).",
    "Fertilization typically occurs in the fallopian tube; the resulting embryo implants in the uterine lining.",
    "If fertilization occurs, the developing placenta secretes hCG (human chorionic gonadotropin), which maintains the corpus luteum and progesterone production — the hormone detected by pregnancy tests."
  ],
  mechanism: "The hypothalamic-pituitary-gonadal axis regulates both male and female reproductive hormones through feedback loops similar to other endocrine systems. In females, rising estrogen from a developing follicle initially provides negative feedback, but right before ovulation it switches to positive feedback, causing a sharp LH surge that triggers the egg's release — one of the few true positive feedback loops in normal physiology.",
  diseaseConnection: [
    "Polycystic ovary syndrome (PCOS): hormonal imbalance (often elevated androgens/insulin resistance) disrupts normal ovulation.",
    "Endometriosis: uterine lining tissue grows outside the uterus, causing pain and potential fertility issues."
  ],
  traps: [
    "The pre-ovulatory estrogen surge causing the LH spike is a rare example of POSITIVE feedback — most of the body's regulation is negative feedback.",
    "Fertilization happens in the fallopian tube, not the uterus; implantation happens later, in the uterus.",
    "hCG is produced by the placenta/developing embryo (after fertilization), not by the ovary itself — it's what pregnancy tests detect."
  ],
  quiz: [
    {q:"The sharp LH surge that triggers ovulation is caused by:", c:["Negative feedback from low estrogen","Positive feedback from rising estrogen","Falling progesterone alone","GnRH suppression"], a:1, ex:"Right before ovulation, high estrogen briefly switches from negative to positive feedback on the pituitary, causing the LH surge — a rare positive feedback example."},
    {q:"Fertilization of an egg by sperm normally occurs in the:", c:["Uterus","Ovary","Fallopian tube","Cervix"], a:2, ex:"Sperm typically meet and fertilize the egg in the fallopian tube, after which the early embryo travels to the uterus to implant."},
    {q:"A home pregnancy test detects which hormone?", c:["Estrogen","FSH","hCG (human chorionic gonadotropin)","Testosterone"], a:2, ex:"hCG is produced by the developing placenta after implantation and is the hormone detected by standard pregnancy tests."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 27-28, Reproductive System"]
},

"physio-blood": {
  simple: "Blood is a connective tissue made of cells suspended in plasma, responsible for transport, defense, and clotting throughout the body.",
  highYield: [
    "Plasma (~55% of blood volume) carries proteins, nutrients, hormones, and waste; the remaining ~45% is mostly red blood cells.",
    "Red blood cells (erythrocytes) carry oxygen via hemoglobin; they lack a nucleus in mammals, maximizing space for hemoglobin.",
    "White blood cells (leukocytes) are the immune system's cellular defenders — includes neutrophils, lymphocytes (B/T cells), monocytes/macrophages, eosinophils, basophils.",
    "Platelets (thrombocytes) are cell fragments essential for clotting, not full cells themselves.",
    "ABO blood typing is based on antigens on red blood cell surfaces (A, B, AB, or neither = type O); Rh factor (+/-) is a separate antigen system.",
    "Clotting cascade: vessel injury → platelets aggregate at the site → a cascade of clotting factors converts fibrinogen into fibrin, forming a mesh that stabilizes the clot.",
    "Erythropoietin (from the kidneys) stimulates red blood cell production in bone marrow in response to low oxygen levels."
  ],
  mechanism: "When a blood vessel is damaged, platelets are the first responders, sticking to exposed collagen and to each other to form a temporary plug. This activates a cascade of clotting factors (proteins normally circulating inactive in plasma) that ultimately converts soluble fibrinogen into insoluble fibrin strands, weaving a mesh that traps blood cells and stabilizes the plug into a durable clot. Vitamin K is required to make several of these clotting factors functional.",
  diseaseConnection: [
    "Hemophilia A: a deficiency in clotting factor VIII impairs the clotting cascade, causing prolonged bleeding after injury.",
    "Sickle cell anemia: a single amino acid substitution in hemoglobin causes red blood cells to distort into a sickle shape under low oxygen, blocking small vessels."
  ],
  traps: [
    "Platelets are cell fragments, not complete cells — don't count them as a fourth 'type' of blood cell in the same sense as red/white cells.",
    "Type O blood has neither A nor B antigens, making it the 'universal donor' for red cells (but type AB plasma, lacking anti-A/anti-B antibodies, is the universal plasma donor) — a frequently confused detail.",
    "Mature red blood cells in mammals have no nucleus — don't assume all blood cells retain a nucleus."
  ],
  quiz: [
    {q:"A deficiency in clotting factor VIII is characteristic of:", c:["Sickle cell anemia","Hemophilia A","Iron-deficiency anemia","Leukemia"], a:1, ex:"Hemophilia A results from a deficiency or dysfunction of clotting factor VIII, impairing the clotting cascade and causing prolonged bleeding."},
    {q:"Which blood component directly forms the fibrous mesh that stabilizes a clot?", c:["Hemoglobin","Fibrin","Albumin","Erythropoietin"], a:1, ex:"Fibrinogen is converted into fibrin strands by the clotting cascade, forming the mesh that traps cells and stabilizes the clot."},
    {q:"Type O negative blood is often called the 'universal donor' for red blood cell transfusions because it:", c:["Has both A and B antigens","Has neither A nor B antigens on red cells","Has the most antibodies","Has the Rh antigen present"], a:1, ex:"Lacking A and B surface antigens, type O red cells are less likely to trigger an ABO-mismatch immune reaction in recipients."}
  ],
  refs: ["OpenStax Anatomy & Physiology — Ch. 18, Blood"]
},

"disease-principles": {
  simple: "Disease processes generally fall into a few core mechanisms: inflammation/injury response, abnormal growth, and breakdowns in normal homeostasis — understanding these patterns helps you reason through unfamiliar diseases.",
  highYield: [
    "Acute inflammation: rapid response to injury/infection — redness, heat, swelling, pain, loss of function; driven by increased blood flow and vessel permeability, with neutrophils as first responders.",
    "Chronic inflammation: prolonged, lower-grade inflammation (macrophages, lymphocytes) that can itself cause tissue damage over time (e.g., in atherosclerosis, rheumatoid arthritis).",
    "Necrosis: uncontrolled, pathological cell death (e.g., from injury, ischemia) that triggers inflammation; apoptosis: programmed, controlled cell death that does NOT trigger inflammation.",
    "Hyperplasia: increase in cell NUMBER; hypertrophy: increase in cell SIZE; both can be normal (e.g., muscle hypertrophy from exercise) or pathological.",
    "Neoplasia: new, abnormal, uncontrolled cell growth; benign tumors stay localized and don't invade, malignant tumors (cancer) invade nearby tissue and can metastasize (spread).",
    "Ischemia: reduced blood flow to a tissue, depriving it of oxygen and nutrients — the underlying mechanism in heart attacks and strokes."
  ],
  mechanism: "Most diseases can be understood as either too much/too little of a needed signal or substance, an inappropriate immune response, abnormal cell growth/death control, or a structural/genetic defect — recognizing which category a disease falls into helps predict its symptoms and treatment logic even for unfamiliar conditions. For example, ischemia leads to a shortage of ATP, triggering necrosis (uncontrolled cell death) when severe enough, which then triggers inflammation as the body tries to clear the dead tissue.",
  diseaseConnection: [
    "Chronic, low-grade inflammation is now understood to be a contributing driver in atherosclerosis, type 2 diabetes, and many cancers — not just an isolated response to acute injury.",
    "Cancer is fundamentally a disease of uncontrolled cell growth (loss of normal checkpoint/apoptosis control) — see Cancer Biology for detail."
  ],
  traps: [
    "Necrosis is messy and triggers inflammation; apoptosis is a clean, programmed process and normally does NOT trigger inflammation — a common point of confusion.",
    "Hyperplasia (more cells) and hypertrophy (bigger cells) are different mechanisms that can look similar (an enlarged organ/tissue) — exams test whether you can tell them apart from a description.",
    "A benign tumor is still abnormal growth, but the defining danger of malignancy is invasion and metastasis, not size alone."
  ],
  quiz: [
    {q:"Which type of cell death is described as a normal, programmed process that typically does NOT trigger inflammation?", c:["Necrosis","Apoptosis","Ischemia","Neoplasia"], a:1, ex:"Apoptosis is a controlled, 'clean' process of cell self-destruction that avoids spilling cell contents and triggering inflammation, unlike necrosis."},
    {q:"An athlete's heart muscle cells increasing in size (not number) due to repeated exercise is an example of:", c:["Hyperplasia","Hypertrophy","Neoplasia","Necrosis"], a:1, ex:"Hypertrophy is an increase in individual cell size; hyperplasia would instead be an increase in cell number."},
    {q:"The key feature that distinguishes a malignant tumor from a benign one is:", c:["Malignant tumors are always larger","Malignant tumors invade nearby tissue and can metastasize","Benign tumors grow faster","Only malignant tumors are made of abnormal cells"], a:1, ex:"Both can show abnormal growth, but malignancy is defined by invasive growth and the ability to spread (metastasize) to distant sites."}
  ],
  refs: ["General pathology overview — undergraduate physiology/pathology textbooks (e.g., Robbins Basic Pathology, introductory chapters)"]
},

"disease-genetic": {
  simple: "Genetic disorders arise from problems in DNA — ranging from a single gene mutation to a whole extra or missing chromosome — and follow predictable inheritance patterns.",
  highYield: [
    "Single-gene (Mendelian) disorders: autosomal recessive (e.g., cystic fibrosis, sickle cell anemia), autosomal dominant (e.g., Huntington's disease), X-linked recessive (e.g., hemophilia, Duchenne muscular dystrophy).",
    "Chromosomal disorders: caused by an abnormal number or structure of chromosomes rather than a single gene mutation (e.g., Down syndrome = trisomy 21).",
    "Multifactorial/complex disorders: result from many genes plus environmental factors interacting (e.g., type 2 diabetes, many cancers, heart disease) — don't follow simple Mendelian ratios.",
    "Genetic counseling uses pedigree analysis and probability to estimate the risk of a genetic disorder in future offspring.",
    "Carrier screening and prenatal testing (karyotype, amniocentesis) can detect many genetic/chromosomal disorders before birth.",
    "Genomic imprinting: some genes are expressed differently depending on which parent they were inherited from, which is why the same deletion on chromosome 15 causes Prader-Willi syndrome (from father) or Angelman syndrome (from mother)."
  ],
  mechanism: "Single-gene disorders typically disrupt one specific protein's function (e.g., a missing enzyme or defective channel protein), producing a fairly predictable, often severe phenotype. Chromosomal disorders affect the dosage of hundreds of genes at once (an extra or missing whole chromosome, or large segment), generally producing a broader, more variable set of symptoms across multiple organ systems. Multifactorial disorders require a 'threshold' of combined genetic susceptibility and environmental triggers before disease appears, which is why family history raises risk without guaranteeing disease.",
  diseaseConnection: [
    "Cystic fibrosis (CFTR mutation, autosomal recessive) and sickle cell anemia (hemoglobin gene mutation, autosomal recessive) are classic single-gene disorders.",
    "Down syndrome (trisomy 21) is the most common chromosomal disorder compatible with long-term survival."
  ],
  traps: [
    "Not all 'genetic' disease is single-gene — many common diseases (heart disease, type 2 diabetes) are multifactorial, with genetics as only one contributing risk factor.",
    "A chromosomal disorder generally affects many genes/systems at once, unlike a single-gene disorder's more localized effect — useful for distinguishing them from a symptom list.",
    "Genomic imprinting means the same deletion can cause different diseases depending on which parent it came from — don't assume all inherited mutations behave identically regardless of parental origin."
  ],
  quiz: [
    {q:"A disorder caused by many contributing genes plus environmental factors, not following a simple Mendelian ratio, is best classified as:", c:["Autosomal dominant","Chromosomal","Multifactorial/complex","X-linked recessive"], a:2, ex:"Multifactorial disorders (e.g., type 2 diabetes, many cancers) arise from combined genetic and environmental contributions rather than a single gene."},
    {q:"Down syndrome (trisomy 21) is best classified as a:", c:["Single-gene autosomal recessive disorder","Chromosomal disorder","X-linked dominant disorder","Multifactorial disorder only"], a:1, ex:"Down syndrome results from an extra copy of an entire chromosome (21), making it a chromosomal rather than single-gene disorder."},
    {q:"The fact that the same chromosome 15 deletion causes Prader-Willi syndrome if inherited from the father, but Angelman syndrome if inherited from the mother, illustrates:", c:["Codominance","Genomic imprinting","Incomplete dominance","X-inactivation"], a:1, ex:"Genomic imprinting means certain genes are expressed (or silenced) differently depending on their parent of origin."}
  ],
  refs: ["NIH Genetics Home Reference / MedlinePlus Genetics — general disorder overviews"]
},

"disease-infectious": {
  simple: "Infectious diseases are caused by pathogens (bacteria, viruses, fungi, parasites) that invade the body, and each pathogen type tends to cause disease through a characteristic mechanism.",
  highYield: [
    "Bacteria: single-celled prokaryotes; can damage tissue directly or via toxins; treated with antibiotics, which exploit differences between bacterial and human cells (e.g., targeting the bacterial cell wall or ribosome).",
    "Viruses: non-living obligate intracellular parasites; hijack host cell machinery to replicate; antibiotics do NOT work on viruses; treated with antivirals or prevented with vaccines.",
    "Fungi: eukaryotic; tend to cause superficial infections (skin, nails) or serious systemic infections mainly in immunocompromised patients.",
    "Parasites (e.g., protozoa like Plasmodium, helminths): live on or in a host and derive nutrients at the host's expense, often with complex life cycles (e.g., malaria's mosquito-to-human cycle).",
    "Modes of transmission: direct contact, airborne droplets, vector-borne (e.g., mosquitoes), fecal-oral, bloodborne.",
    "Koch's postulates: a classic framework for establishing that a specific pathogen causes a specific disease."
  ],
  mechanism: "Because antibiotics typically target structures unique to bacteria (cell walls, bacterial ribosomes, bacterial DNA replication enzymes), they are highly effective against bacterial infections but useless against viruses, which use the host's own human cellular machinery to replicate and therefore lack these unique bacterial targets. This is also why antibiotic resistance evolves through natural selection: surviving bacteria with resistance mutations (or resistance genes shared via plasmids) multiply and dominate after exposure to an antibiotic that kills susceptible competitors.",
  diseaseConnection: [
    "Tuberculosis (bacterial) requires a long multi-drug antibiotic course partly because Mycobacterium tuberculosis grows slowly and can persist in a dormant state.",
    "Influenza (viral) cannot be cured by antibiotics; prevention relies on vaccination and management relies on supportive care/antivirals."
  ],
  traps: [
    "Antibiotics never work on viral infections — a frequently tested point given real-world antibiotic misuse.",
    "Viruses are not classified as living cells on their own; they require a host cell's machinery to replicate.",
    "Not all parasites are microscopic — helminths (worms) are visible multicellular parasites with complex life cycles."
  ],
  quiz: [
    {q:"Antibiotics are ineffective against viral infections primarily because:", c:["Viruses are too small to be affected by chemicals","Viruses lack the bacterial structures (cell wall, bacterial ribosomes) that antibiotics target","Viruses are resistant to all drugs","Antibiotics only work on parasites"], a:1, ex:"Antibiotics exploit structural/biochemical differences unique to bacteria; viruses use host cell machinery and lack these bacterial-specific targets."},
    {q:"A pathogen that is an obligate intracellular parasite, requiring a host cell's ribosomes and machinery to replicate, is most likely a:", c:["Bacterium","Virus","Fungus","Helminth (parasitic worm)"], a:1, ex:"Viruses cannot replicate independently — they must hijack a host cell's machinery, defining them as obligate intracellular parasites."},
    {q:"Antibiotic resistance typically spreads in a bacterial population mainly through:", c:["Random chance with no selective advantage","Natural selection favoring survivors with resistance genes after antibiotic exposure","Viral mutation","Loss of all bacterial DNA"], a:1, ex:"Antibiotic exposure kills susceptible bacteria, leaving resistant survivors (via mutation or shared resistance genes) to multiply and dominate the population."}
  ],
  refs: ["CDC.gov — general disease and pathogen overviews", "OpenStax Biology 2e — Ch. 24, Prokaryotes; Ch. 21, Viruses"]
},

"disease-immune-cancer": {
  simple: "When the immune system misfires, it can attack the body's own tissues (autoimmunity) or fail to control infections/abnormal cells; cancer is a related but distinct breakdown in the normal controls on cell growth.",
  highYield: [
    "Autoimmune disease: the immune system mistakenly targets the body's own healthy cells as if they were foreign (e.g., type 1 diabetes attacks pancreatic beta cells, rheumatoid arthritis attacks joint tissue).",
    "Hypersensitivity (allergy): an exaggerated immune response to a normally harmless substance (allergen); severe systemic reactions can cause anaphylaxis.",
    "Immunodeficiency: a weakened immune system, either inherited (primary, e.g., SCID) or acquired (secondary, e.g., HIV/AIDS, chemotherapy), leading to increased infection risk.",
    "Cancer's hallmark features: sustained proliferative signaling, evasion of growth suppressors (e.g., lost p53 function), resistance to apoptosis, ability to invade tissue and metastasize, and the ability to trigger new blood vessel growth (angiogenesis) to feed the tumor.",
    "Oncogenes: mutated/overactive genes that promote cancer (originally normal genes called proto-oncogenes); tumor suppressor genes (e.g., p53, BRCA1/2) normally restrain cell division — cancer often requires loss of these brakes.",
    "Metastasis: cancer cells break away from the original tumor, travel via blood or lymph, and establish new tumors at distant sites — the major cause of cancer mortality."
  ],
  mechanism: "Cancer develops through an accumulation of multiple mutations over time (not usually a single mutation) that together activate oncogenes (gas pedal stuck down) and inactivate tumor suppressor genes (brakes cut), allowing a cell lineage to divide uncontrollably while evading the normal checkpoints and apoptosis triggers that would otherwise eliminate damaged cells. Autoimmune disease, by contrast, usually results from a failure of immune self-tolerance — mechanisms that normally prevent T and B cells from attacking the body's own antigens break down, allowing self-reactive immune cells to persist and cause tissue damage.",
  diseaseConnection: [
    "BRCA1/2 mutations impair DNA repair and tumor suppressor function, dramatically increasing breast and ovarian cancer risk.",
    "Systemic lupus erythematosus: a broad autoimmune disease where antibodies attack DNA and other normal cellular components across multiple organ systems."
  ],
  traps: [
    "An allergy (hypersensitivity) is an overreaction to a foreign, usually harmless substance; autoimmune disease is an attack on the body's OWN tissue — different targets, often confused.",
    "Oncogenes are typically caused by a gain-of-function mutation (overactive); tumor suppressor gene mutations are typically loss-of-function (brakes removed) — opposite mechanisms leading to the same outcome.",
    "A tumor itself rarely kills directly when small and localized — metastasis to vital organs is the main driver of cancer mortality."
  ],
  quiz: [
    {q:"Type 1 diabetes, in which the immune system destroys the pancreas's own insulin-producing cells, is best classified as:", c:["An allergy","An autoimmune disease","An immunodeficiency","A chromosomal disorder"], a:1, ex:"Autoimmune disease occurs when the immune system mistakenly targets the body's own cells/tissues, as occurs in type 1 diabetes."},
    {q:"A mutation that turns a normal proto-oncogene into an active oncogene typically:", c:["Removes a tumor suppressor's function","Causes a gain-of-function, promoting cell division","Has no effect on cancer risk","Always causes immediate cell death"], a:1, ex:"Oncogenes typically arise from gain-of-function mutations in proto-oncogenes, pushing cells toward uncontrolled division."},
    {q:"The majority of cancer-related deaths are caused by:", c:["The original primary tumor's size alone","Metastasis to distant, vital organs","Allergic reactions to the tumor","Immediate apoptosis of cancer cells"], a:1, ex:"Once cancer cells metastasize and establish tumors in vital organs (e.g., liver, lungs, brain), the resulting organ damage is the leading cause of cancer mortality."}
  ],
  refs: ["NCI (cancer.gov) — Hallmarks of Cancer overview", "NIAID — autoimmune disease overview"]
}

};

/* ===================== DISEASE ATLAS ===================== */
var DISEASES = {

cardiovascular: {label:"Cardiovascular", icon:"❤️", items:[
  {name:"Atherosclerosis", cause:"High LDL cholesterol, smoking, hypertension, diabetes damage artery walls over time.", mechanism:"LDL cholesterol deposits in damaged arterial walls, triggering an immune/inflammatory response that builds a fatty plaque, narrowing the artery and stiffening it.", symptoms:"Often silent for years; eventually angina (chest pain on exertion) as flow is restricted.", diagnostic:"Elevated LDL/cholesterol panel; imaging (angiography) shows narrowed arteries.", treatment:"Statins to lower LDL, lifestyle changes, antiplatelets; severe cases need stenting/bypass.", trap:"Atherosclerosis itself is usually asymptomatic until a plaque ruptures or severely narrows a vessel — don't assume early disease causes pain."},
  {name:"Myocardial Infarction", cause:"Sudden blockage of a coronary artery, usually from a ruptured atherosclerotic plaque triggering a clot.", mechanism:"Blocked blood flow causes ischemia, then necrosis of heart muscle within minutes to hours if not restored.", symptoms:"Crushing chest pain (often radiating to arm/jaw), shortness of breath, sweating, nausea.", diagnostic:"Elevated cardiac troponin in blood; ST-segment changes on ECG.", treatment:"Emergency reperfusion (clot-busting drugs or angioplasty/stent), then long-term antiplatelets/statins.", trap:"Symptoms can be atypical (no chest pain) in women, older adults, and diabetics — don't rely only on 'classic' presentation."},
  {name:"Hypertension", cause:"Often multifactorial: genetics, high salt intake, obesity, chronic stress, kidney dysfunction.", mechanism:"Sustained increase in the force blood exerts on artery walls, often from increased peripheral resistance or blood volume, which over time damages vessels and organs.", symptoms:"Usually asymptomatic ('silent killer') until it causes organ damage.", diagnostic:"Repeated blood pressure readings ≥130/80-140/90 mmHg depending on guideline.", treatment:"Lifestyle changes (diet, exercise, salt reduction); medications such as ACE inhibitors, diuretics, beta-blockers.", trap:"Most hypertension has no symptoms — it's identified by routine measurement, not by how the patient feels."}
]},

blood: {label:"Blood", icon:"🩸", items:[
  {name:"Sickle Cell Anemia", cause:"Autosomal recessive point mutation in the beta-globin gene (single amino acid substitution in hemoglobin).", mechanism:"Abnormal hemoglobin (HbS) polymerizes under low oxygen, distorting red blood cells into a rigid sickle shape that blocks small vessels and breaks down prematurely.", symptoms:"Chronic anemia, painful vaso-occlusive crises, increased infection risk.", diagnostic:"Hemoglobin electrophoresis showing HbS.", treatment:"Pain management, hydroxyurea (increases fetal hemoglobin), blood transfusions; bone marrow transplant can be curative.", trap:"It's a single point mutation (one amino acid change), not a chromosomal disorder — easy to misclassify."},
  {name:"Iron-Deficiency Anemia", cause:"Insufficient dietary iron, chronic blood loss, or poor absorption.", mechanism:"Without enough iron, hemoglobin cannot be synthesized normally, leading to small, pale red blood cells with reduced oxygen-carrying capacity.", symptoms:"Fatigue, pallor, shortness of breath, brittle nails.", diagnostic:"Low ferritin and low mean corpuscular volume (microcytic anemia) on blood tests.", treatment:"Iron supplementation; treat the underlying cause of blood loss if present.", trap:"Anemia is a sign, not a single disease — iron deficiency is only one of several distinct causes of anemia (others include B12 deficiency, chronic disease)."},
  {name:"Hemophilia A", cause:"X-linked recessive deficiency of clotting factor VIII.", mechanism:"Without enough functional factor VIII, the clotting cascade cannot efficiently form fibrin, so clots form slowly and weakly.", symptoms:"Prolonged bleeding after injury, spontaneous joint bleeding (hemarthrosis) in severe cases.", diagnostic:"Prolonged partial thromboplastin time (PTT) with normal prothrombin time (PT); confirmed by factor VIII assay.", treatment:"Factor VIII replacement infusions.", trap:"X-linked recessive means it overwhelmingly affects males; female carriers are typically asymptomatic or mildly affected."}
]},

lung: {label:"Lung", icon:"🫁", items:[
  {name:"Asthma", cause:"Genetic predisposition plus environmental triggers (allergens, exercise, cold air, infection).", mechanism:"Airway hyperresponsiveness causes bronchiole smooth muscle constriction, inflammation, and excess mucus, narrowing airways and increasing resistance to airflow.", symptoms:"Wheezing, shortness of breath, chest tightness, coughing, often episodic.", diagnostic:"Spirometry showing reduced airflow (reduced FEV1) that improves significantly with a bronchodilator.", treatment:"Short-acting bronchodilators (rescue inhalers) for acute attacks; inhaled corticosteroids for long-term control.", trap:"Asthma airflow obstruction is classically reversible (with bronchodilators); this reversibility is a key distinguishing feature from COPD."},
  {name:"COPD", cause:"Long-term exposure to irritants, overwhelmingly cigarette smoking.", mechanism:"Chronic inflammation damages alveoli (emphysema, reducing surface area for gas exchange) and/or the airways (chronic bronchitis, excess mucus and narrowing), causing largely irreversible airflow limitation.", symptoms:"Chronic cough, sputum production, progressive shortness of breath.", diagnostic:"Spirometry shows reduced FEV1/FVC ratio that does NOT fully reverse with bronchodilators.", treatment:"Smoking cessation (most important), bronchodilators, inhaled steroids, oxygen therapy in advanced disease.", trap:"Unlike asthma, COPD's airflow limitation is largely irreversible — a key contrast point for exams."},
  {name:"Pneumonia", cause:"Infection of the lung tissue/alveoli, most often bacterial (e.g., Streptococcus pneumoniae) or viral.", mechanism:"Pathogens trigger an inflammatory response in the alveoli, filling them with fluid and immune cells (consolidation), impairing gas exchange.", symptoms:"Fever, productive cough, chest pain on breathing, shortness of breath.", diagnostic:"Chest X-ray showing consolidation/infiltrate; sputum culture to identify the pathogen.", treatment:"Antibiotics for bacterial pneumonia; supportive care (and sometimes antivirals) for viral pneumonia.", trap:"Antibiotics only help bacterial pneumonia — giving them for a purely viral pneumonia does nothing for the infection itself."}
]},

gi: {label:"GI", icon:"🍽️", items:[
  {name:"Peptic Ulcer Disease", cause:"Most commonly H. pylori infection or chronic NSAID use, which weaken the stomach/duodenal protective lining.", mechanism:"Loss of the protective mucous barrier lets stomach acid and pepsin erode the underlying tissue, forming an open sore.", symptoms:"Burning epigastric pain, often related to meals; can cause bleeding (dark stools) if severe.", diagnostic:"Endoscopy visualizes the ulcer; testing for H. pylori (breath, stool antigen, or biopsy test).", treatment:"Antibiotics if H. pylori positive, proton pump inhibitors to reduce acid, stopping NSAIDs.", trap:"Most peptic ulcers are caused by H. pylori infection, not primarily by stress or spicy food as commonly assumed."},
  {name:"Crohn's Disease", cause:"Autoimmune/inflammatory bowel disease with genetic and environmental contributors; exact trigger unclear.", mechanism:"Chronic inflammation can affect any part of the GI tract (mouth to anus) in patchy 'skip lesions,' penetrating through the full thickness of the bowel wall.", symptoms:"Abdominal pain, diarrhea (sometimes bloody), weight loss, fatigue.", diagnostic:"Colonoscopy with biopsy showing transmural inflammation and skip lesions; elevated inflammatory markers.", treatment:"Anti-inflammatory and immunosuppressive medications (e.g., biologics); surgery for complications.", trap:"Crohn's can affect any part of the GI tract in patches; ulcerative colitis (a different IBD) is continuous and limited to the colon/rectum — a classic exam contrast."},
  {name:"Cirrhosis", cause:"Chronic liver damage from causes such as long-term alcohol use, chronic viral hepatitis, or fatty liver disease.", mechanism:"Repeated liver injury and repair replaces healthy tissue with scar tissue (fibrosis), progressively impairing the liver's ability to filter blood, produce proteins, and process toxins.", symptoms:"Fatigue, jaundice, easy bruising (reduced clotting factor production), abdominal swelling (ascites).", diagnostic:"Liver function tests, imaging, and ultimately liver biopsy showing fibrosis/nodules.", treatment:"Treat the underlying cause, manage complications; liver transplant in advanced/end-stage disease.", trap:"Cirrhosis is the SCARRING (fibrosis) itself — it is a structural, generally irreversible end-stage of chronic liver injury, not a description of any single original cause."}
]},

kidney: {label:"Kidney", icon:"🫘", items:[
  {name:"Chronic Kidney Disease", cause:"Most commonly long-standing diabetes or hypertension damaging the kidneys over years.", mechanism:"Progressive loss of functioning nephrons reduces filtration capacity, allowing waste products to accumulate and disrupting fluid/electrolyte/hormone balance.", symptoms:"Often asymptomatic early; later fatigue, swelling, changes in urination, eventually uremia symptoms.", diagnostic:"Elevated creatinine/blood urea nitrogen; reduced estimated glomerular filtration rate (eGFR).", treatment:"Control underlying cause (blood sugar, blood pressure); dialysis or transplant in end-stage disease.", trap:"Diabetes and hypertension are by far the leading causes of CKD — not primarily diet or hereditary kidney disease in most cases."},
  {name:"Nephrolithiasis (Kidney Stones)", cause:"Concentrated urine allows minerals (most commonly calcium oxalate) to crystallize; risk increases with dehydration and certain diets.", mechanism:"Crystals aggregate into a solid stone that can lodge in the ureter, causing obstruction and intense, spasmodic pain as the ureter tries to push it through.", symptoms:"Sudden, severe flank pain that may radiate to the groin; blood in urine.", diagnostic:"CT scan (most sensitive) or ultrasound; urinalysis often shows blood.", treatment:"Hydration and pain control for small stones (often pass on their own); lithotripsy or surgical removal for larger stones.", trap:"Pain from kidney stones is typically intermittent/colicky (comes in waves) as the stone moves, not constant — a useful distinguishing clue."},
  {name:"Glomerulonephritis", cause:"Often immune-mediated — antibody complexes deposit in or attack the glomeruli, sometimes following a streptococcal infection.", mechanism:"Inflammation of the glomeruli damages the filtration barrier, allowing blood cells and excess protein to leak into the urine and impairing filtration.", symptoms:"Blood in urine (hematuria), protein in urine (proteinuria), swelling, possibly high blood pressure.", diagnostic:"Urinalysis showing red blood cells/protein; kidney biopsy for definitive diagnosis.", treatment:"Treat underlying cause/infection; immunosuppressive therapy for autoimmune-driven cases.", trap:"Glomerulonephritis is an inflammatory/immune process affecting the filter itself, distinct from a simple infection of the urinary tract (like a UTI)."}
]},

endocrine: {label:"Endocrine", icon:"⚖️", items:[
  {name:"Type 1 Diabetes Mellitus", cause:"Autoimmune destruction of insulin-producing pancreatic beta cells.", mechanism:"Without insulin, cells cannot take up glucose efficiently, so blood glucose rises while cells are starved of fuel, often shifting metabolism toward fat breakdown and ketone production.", symptoms:"Excessive thirst/urination, weight loss, fatigue; can progress to diabetic ketoacidosis if untreated.", diagnostic:"High fasting blood glucose/HbA1c; presence of autoantibodies; low/absent C-peptide (a marker of the body's own insulin production).", treatment:"Lifelong insulin replacement therapy.", trap:"Type 1 diabetes is an autoimmune beta-cell destruction process, NOT primarily caused by diet/obesity like type 2 — a frequently tested distinction."},
  {name:"Type 2 Diabetes Mellitus", cause:"Combination of genetic predisposition and lifestyle factors (obesity, inactivity) leading to insulin resistance.", mechanism:"Cells become less responsive to insulin over time, so the pancreas compensates by producing more insulin until beta cells eventually become exhausted/dysfunctional, and blood glucose rises.", symptoms:"Often gradual onset: increased thirst/urination, fatigue, blurred vision; can be asymptomatic for years.", diagnostic:"Elevated fasting glucose/HbA1c; insulin levels may be normal or high (unlike type 1).", treatment:"Lifestyle changes (diet, exercise, weight loss) first-line; oral medications (e.g., metformin); insulin if needed later.", trap:"Type 2 diabetes starts with insulin RESISTANCE, not insulin deficiency — insulin levels can initially be normal or even elevated, unlike type 1."},
  {name:"Graves' Disease", cause:"Autoimmune disorder where antibodies mimic and continuously stimulate the TSH receptor on the thyroid.", mechanism:"Constant TSH-receptor stimulation drives excess thyroid hormone production, overriding the normal negative feedback control of the hypothalamic-pituitary-thyroid axis.", symptoms:"Weight loss, rapid heart rate, heat intolerance, anxiety, bulging eyes (exophthalmos).", diagnostic:"Low TSH with high T3/T4; positive TSH-receptor antibodies.", treatment:"Anti-thyroid medications, radioactive iodine, or surgery in some cases.", trap:"Because the thyroid is being driven by an antibody mimicking TSH (not by the pituitary), TSH itself is LOW — a classic point of confusion since you might expect TSH to be high if the thyroid is overactive."}
]},

immune: {label:"Immune", icon:"🛡️", items:[
  {name:"Rheumatoid Arthritis", cause:"Autoimmune disease; exact trigger unknown, with genetic and environmental contributors.", mechanism:"Immune cells attack the synovium (joint lining), causing chronic inflammation that progressively damages cartilage and bone.", symptoms:"Symmetric joint pain/swelling/stiffness (worse in the morning), most often in small joints of hands/feet.", diagnostic:"Positive rheumatoid factor and/or anti-CCP antibodies; elevated inflammatory markers (ESR/CRP).", treatment:"Disease-modifying antirheumatic drugs (DMARDs), biologics, anti-inflammatories.", trap:"RA classically causes symmetric small-joint involvement with morning stiffness, unlike osteoarthritis, which is typically asymmetric and worsens with activity."},
  {name:"Systemic Lupus Erythematosus", cause:"Autoimmune disease where the immune system produces antibodies against the body's own nuclear components (e.g., DNA).", mechanism:"Immune complexes deposit in tissues throughout the body (skin, joints, kidneys, blood vessels), triggering widespread inflammation and organ damage.", symptoms:"Malar ('butterfly') facial rash, joint pain, fatigue, kidney involvement (lupus nephritis) in many cases.", diagnostic:"Positive antinuclear antibody (ANA) test; more specific anti-dsDNA antibodies support the diagnosis.", treatment:"Immunosuppressive medications, corticosteroids during flares; treatment tailored to organs affected.", trap:"Lupus can affect almost any organ system, making it a classic 'great imitator' — don't expect one single, uniform symptom pattern."},
  {name:"Anaphylaxis", cause:"Severe, rapid systemic allergic (hypersensitivity) reaction to an allergen (e.g., food, insect sting, medication) in a sensitized individual.", mechanism:"Allergen cross-links IgE antibodies on mast cells/basophils, triggering massive histamine release, causing widespread vasodilation, vascular leakage, and airway constriction.", symptoms:"Hives, swelling (especially face/throat), difficulty breathing, rapid drop in blood pressure (shock).", diagnostic:"Clinical diagnosis based on rapid onset after allergen exposure with multi-system involvement.", treatment:"Immediate epinephrine injection; antihistamines and steroids as adjuncts.", trap:"Anaphylaxis is a medical emergency requiring epinephrine first — antihistamines alone are not fast or strong enough to reverse it."}
]},

infectious: {label:"Infectious", icon:"🦠", items:[
  {name:"Influenza", cause:"Influenza virus (RNA virus), spread via respiratory droplets; frequently mutates (antigenic drift/shift), requiring updated vaccines each year.", mechanism:"The virus infects and hijacks respiratory tract epithelial cells to replicate, triggering both direct cell damage and a strong immune/inflammatory response.", symptoms:"Sudden fever, body aches, fatigue, cough, sore throat.", diagnostic:"Rapid antigen test or PCR from a nasal/throat swab.", treatment:"Supportive care; antiviral medications (e.g., oseltamivir) if started early; annual vaccination for prevention.", trap:"Influenza mutates frequently enough that prior infection or vaccination doesn't guarantee future immunity — this is why annual vaccination is needed."},
  {name:"Tuberculosis", cause:"Infection with Mycobacterium tuberculosis, a slow-growing bacterium spread via airborne droplets.", mechanism:"The bacteria are engulfed by macrophages but can survive inside them; the immune system walls off the infection into a granuloma, where it can remain dormant (latent TB) for years before potentially reactivating.", symptoms:"Chronic cough (sometimes with blood), night sweats, weight loss, fever.", diagnostic:"Tuberculin skin test or interferon-gamma release assay for screening; chest X-ray and sputum culture/PCR for active disease.", treatment:"Prolonged multi-drug antibiotic regimen (typically 6+ months) to fully eradicate the slow-growing bacteria.", trap:"TB can remain dormant for years as latent infection (no symptoms, not contagious) before potentially reactivating — latent TB is not the same as active disease."},
  {name:"Malaria", cause:"Infection with Plasmodium parasites, transmitted by the bite of an infected Anopheles mosquito.", mechanism:"The parasite infects and ruptures red blood cells in cycles, releasing parasites and cell debris that trigger waves of fever and destroy red blood cells (causing anemia).", symptoms:"Cyclic high fevers with chills/sweating, fatigue, anemia.", diagnostic:"Blood smear showing parasites inside red blood cells; rapid diagnostic antigen tests.", treatment:"Antimalarial medications (e.g., artemisinin-based combination therapy); prevention via mosquito control and prophylactic medication for travelers.", trap:"Malaria is caused by a eukaryotic parasite (Plasmodium), not a virus or bacterium — antibiotics are not the treatment."}
]},

nervous: {label:"Nervous", icon:"🧠", items:[
  {name:"Alzheimer's Disease", cause:"Multifactorial; involves accumulation of amyloid-beta plaques and tau protein tangles in the brain, with age as the strongest risk factor.", mechanism:"Plaques and tangles progressively disrupt neuron function and communication, eventually causing widespread neuron death, particularly affecting memory-related brain regions first.", symptoms:"Progressive memory loss, confusion, difficulty with language and problem-solving, personality changes.", diagnostic:"Primarily clinical (cognitive testing, history); brain imaging can show atrophy; definitive diagnosis traditionally required autopsy, though biomarker tests are advancing.", treatment:"No cure; some medications can modestly slow symptom progression; supportive care is central.", trap:"Alzheimer's involves progressive neuron loss/death, not just a temporary chemical imbalance — this is why it's currently irreversible."},
  {name:"Parkinson's Disease", cause:"Progressive loss of dopamine-producing neurons in the substantia nigra region of the brain; exact trigger usually unknown.", mechanism:"Reduced dopamine disrupts the brain circuits that normally coordinate smooth, voluntary movement.", symptoms:"Resting tremor, muscle rigidity, slowness of movement (bradykinesia), postural instability.", diagnostic:"Primarily clinical, based on characteristic motor symptoms; response to dopamine-replacement medication supports the diagnosis.", treatment:"Levodopa (converted to dopamine in the brain) and other dopamine-supporting medications; deep brain stimulation in advanced cases.", trap:"Parkinson's symptoms result from a DOPAMINE deficiency in a specific brain region, not a general 'brain shrinkage' like Alzheimer's — different neurotransmitter, different symptom pattern."},
  {name:"Multiple Sclerosis", cause:"Autoimmune disease in which the immune system attacks the myelin sheath of neurons in the central nervous system.", mechanism:"Myelin damage slows or blocks electrical signal conduction along affected neurons, and scarring (sclerosis) can permanently disrupt function over time.", symptoms:"Variable and depends on which nerves are affected — vision problems, numbness/tingling, muscle weakness, fatigue; often relapsing-remitting in early stages.", diagnostic:"MRI showing characteristic demyelinating lesions in the brain/spinal cord; supported by cerebrospinal fluid analysis.", treatment:"Disease-modifying immunotherapies to reduce relapse frequency; symptom-specific management.", trap:"MS symptoms can vary enormously between patients depending on which nerves are demyelinated — there isn't one single 'typical' presentation."}
]},

skin: {label:"Skin", icon:"🧴", items:[
  {name:"Eczema (Atopic Dermatitis)", cause:"Combination of genetic skin-barrier dysfunction and immune hypersensitivity; often runs with asthma/allergies ('atopic triad').", mechanism:"A defective skin barrier allows irritants/allergens to penetrate more easily and moisture to escape, triggering chronic inflammation and itching.", symptoms:"Dry, itchy, inflamed patches of skin, often in skin folds (elbows, knees).", diagnostic:"Primarily clinical, based on appearance, distribution, and personal/family history of atopy.", treatment:"Moisturizers to restore the skin barrier, topical corticosteroids for flares, trigger avoidance.", trap:"Eczema is fundamentally a skin-barrier and immune hypersensitivity problem, not an infection — antibiotics don't treat it (unless a secondary infection develops)."},
  {name:"Psoriasis", cause:"Autoimmune-driven; immune cells (T cells) trigger excessive, accelerated skin cell turnover.", mechanism:"Skin cells are produced and shed far faster than normal, building up into thick, scaly plaques before they can mature and shed normally.", symptoms:"Well-defined, raised, red plaques with silvery scale, often on elbows, knees, scalp.", diagnostic:"Primarily clinical appearance; skin biopsy can confirm in unclear cases.", treatment:"Topical steroids/vitamin D analogs for mild cases; phototherapy or systemic immunosuppressants/biologics for more severe disease.", trap:"Psoriasis is driven by immune-mediated accelerated cell turnover, not by an infection or simple dryness — a key conceptual distinction from eczema."},
  {name:"Melanoma", cause:"UV radiation damage (sun exposure, tanning beds) causing mutations in melanocytes (pigment-producing skin cells); also genetic risk factors.", mechanism:"Accumulated DNA damage in melanocytes drives uncontrolled growth, and melanoma is particularly prone to early invasion and metastasis compared to other skin cancers.", symptoms:"A mole that is Asymmetric, has irregular Borders, varied Color, large Diameter, or is Evolving (the 'ABCDE' warning signs).", diagnostic:"Skin biopsy with histological examination; staging often includes checking nearby lymph nodes.", treatment:"Surgical excision for localized disease; immunotherapy/targeted therapy for advanced/metastatic disease.", trap:"Melanoma is far more likely to metastasize early than the more common basal cell or squamous cell skin cancers — size of the original lesion doesn't reliably predict danger."}
]},

bonejoint: {label:"Bone & Joint", icon:"🦴", items:[
  {name:"Osteoporosis", cause:"Age-related bone density loss, accelerated by estrogen decline after menopause, low calcium/vitamin D, or inactivity.", mechanism:"Bone resorption (by osteoclasts) outpaces bone formation (by osteoblasts) over time, leaving bones porous, weaker, and more fracture-prone.", symptoms:"Often silent until a fracture occurs (commonly hip, spine, or wrist) from minor trauma.", diagnostic:"Bone mineral density scan (DEXA scan).", treatment:"Calcium/vitamin D supplementation, weight-bearing exercise, medications that slow bone resorption (e.g., bisphosphonates).", trap:"Osteoporosis is usually asymptomatic until a fracture happens — it is not the same as the joint pain seen in osteoarthritis."},
  {name:"Osteoarthritis", cause:"Mechanical wear-and-tear on joints over time, worsened by age, obesity, and joint overuse/injury.", mechanism:"Progressive breakdown of joint cartilage reduces cushioning between bones, leading to bone-on-bone friction, pain, and reactive bone changes (osteophytes/bone spurs).", symptoms:"Joint pain that worsens with activity and improves with rest; stiffness, usually asymmetric, in weight-bearing joints (knees, hips).", diagnostic:"X-ray showing joint space narrowing and osteophytes; clinical symptom pattern.", treatment:"Weight management, physical therapy, pain relievers/anti-inflammatories; joint replacement in severe cases.", trap:"Osteoarthritis pain typically worsens WITH activity and improves with rest — the opposite pattern from rheumatoid arthritis's morning stiffness that improves with movement."},
  {name:"Gout", cause:"Elevated blood uric acid levels (from overproduction or underexcretion), often linked to diet, alcohol, or kidney function.", mechanism:"Excess uric acid crystallizes into sharp urate crystals within a joint, triggering an intense acute inflammatory response.", symptoms:"Sudden, severe pain, redness, and swelling in a joint, classically the big toe.", diagnostic:"Joint fluid aspiration showing needle-shaped urate crystals under polarized light; elevated serum uric acid.", treatment:"Anti-inflammatories for acute attacks; urate-lowering medications (e.g., allopurinol) for long-term prevention.", trap:"Gout's classic presentation is sudden, severe pain in a single joint (often the big toe) — its rapid onset distinguishes it from the gradual pain of osteoarthritis."}
]},

muscle: {label:"Muscle", icon:"💪", items:[
  {name:"Duchenne Muscular Dystrophy", cause:"X-linked recessive mutation in the dystrophin gene.", mechanism:"Dystrophin normally stabilizes the muscle cell membrane during contraction; without it, muscle fibers are fragile and progressively break down and are replaced by fat/scar tissue.", symptoms:"Progressive muscle weakness beginning in early childhood, typically starting in the hips/legs (e.g., difficulty rising from the floor).", diagnostic:"Elevated creatine kinase (CK) in blood (marker of muscle breakdown); genetic testing for dystrophin mutations confirms diagnosis.", treatment:"No cure; corticosteroids can slow progression; supportive/physical therapy; emerging gene therapies.", trap:"X-linked recessive means DMD overwhelmingly affects males; it presents in early childhood, distinguishing it from later-onset muscle diseases."},
  {name:"Myasthenia Gravis", cause:"Autoimmune disease where antibodies attack acetylcholine receptors at the neuromuscular junction.", mechanism:"Blocked/destroyed acetylcholine receptors reduce the muscle's ability to respond to nerve signals, especially as receptors are used up with repeated stimulation.", symptoms:"Muscle weakness that worsens with repeated use/through the day and improves with rest, often affecting eyelids/eye muscles first (drooping eyelid, double vision).", diagnostic:"Antibody testing (anti-acetylcholine receptor antibodies); electrophysiological testing showing a characteristic decline in muscle response with repeated stimulation.", treatment:"Medications that increase acetylcholine availability (acetylcholinesterase inhibitors); immunosuppressants for the underlying autoimmune process.", trap:"Myasthenia gravis weakness classically WORSENS with sustained activity and improves with rest — opposite of typical muscle fatigue patterns from overuse alone."}
]},

reproductive: {label:"Reproductive", icon:"🌸", items:[
  {name:"Polycystic Ovary Syndrome (PCOS)", cause:"Hormonal imbalance involving elevated androgens and often insulin resistance; exact cause not fully understood.", mechanism:"Elevated androgens and disrupted hormone signaling prevent normal follicle maturation and ovulation, leading to irregular cycles and small, persistent ovarian cysts.", symptoms:"Irregular or absent periods, excess hair growth, acne, and difficulty conceiving.", diagnostic:"Clinical criteria combining irregular ovulation, elevated androgens, and ultrasound findings of multiple small ovarian follicles.", treatment:"Lifestyle changes (weight management), hormonal contraceptives to regulate cycles, medications to induce ovulation if pregnancy is desired.", trap:"Despite the name, not all patients with PCOS actually have ovarian 'cysts' that are clinically significant — diagnosis relies on a broader combination of features, not ultrasound alone."},
  {name:"Endometriosis", cause:"Endometrial-like tissue grows outside the uterus (e.g., on ovaries, fallopian tubes, pelvic lining); exact origin debated.", mechanism:"This ectopic tissue responds to the menstrual cycle's hormones just like the uterine lining, bleeding and causing inflammation/scarring in places it shouldn't, since it has no way to exit the body.", symptoms:"Chronic pelvic pain, painful periods, pain during intercourse, potential infertility.", diagnostic:"Definitive diagnosis requires laparoscopic surgery to visualize/biopsy the tissue; imaging can suggest but not confirm it.", treatment:"Pain management, hormonal therapy to suppress the menstrual cycle, surgical removal of ectopic tissue in more severe cases.", trap:"Symptom severity does not always correlate with how much ectopic tissue is present — some patients with extensive disease have mild symptoms, and vice versa."},
  {name:"Benign Prostatic Hyperplasia", cause:"Age-related hormonal changes cause non-cancerous enlargement of the prostate gland, very common in older men.", mechanism:"The enlarging prostate surrounds and compresses the urethra, obstructing normal urine flow from the bladder.", symptoms:"Difficulty starting urination, weak stream, frequent urination (especially at night), incomplete bladder emptying.", diagnostic:"Digital rectal exam showing enlarged prostate; urinary flow studies; PSA may be mildly elevated.", treatment:"Medications to relax prostate/bladder muscle or shrink the prostate; surgery for severe obstruction.", trap:"BPH is a benign (non-cancerous) condition — its symptoms can overlap with prostate cancer, but the two are mechanistically distinct and BPH does not turn into cancer."}
]},

cancergenetic: {label:"Cancer & Genetic", icon:"🧬", items:[
  {name:"Down Syndrome (Trisomy 21)", cause:"An extra full or partial copy of chromosome 21, most often from nondisjunction during meiosis.", mechanism:"The extra genetic material disrupts normal gene dosage across many genes simultaneously, broadly affecting development.", symptoms:"Characteristic facial features, intellectual disability of varying degree, increased risk of congenital heart defects.", diagnostic:"Prenatal screening (e.g., cell-free DNA testing) and karyotype confirmation; karyotype is also used postnatally.", treatment:"No cure; supportive care, early intervention therapies, and management of associated conditions (e.g., heart defects) improve outcomes.", trap:"Down syndrome risk increases sharply with maternal age, but it is caused by a meiotic chromosome error, not an inherited single-gene mutation passed down predictably."},
  {name:"Huntington's Disease", cause:"Autosomal dominant mutation: an expanded CAG trinucleotide repeat in the HTT gene.", mechanism:"The expanded repeat produces an abnormal huntingtin protein that progressively damages neurons, especially in brain regions controlling movement and cognition.", symptoms:"Progressive involuntary movements (chorea), cognitive decline, psychiatric symptoms; onset typically in mid-adulthood.", diagnostic:"Genetic testing confirms the number of CAG repeats in the HTT gene.", treatment:"No cure; medications can help manage movement and psychiatric symptoms.", trap:"As an autosomal DOMINANT disorder, a child of an affected parent has a 50% chance of inheriting it regardless of sex — unlike the recessive disorders more commonly emphasized in basic genetics."},
  {name:"Cystic Fibrosis", cause:"Autosomal recessive mutation in the CFTR gene (most commonly the ΔF508 deletion).", mechanism:"Defective CFTR chloride channels disrupt salt and water movement across epithelial cells, producing abnormally thick, sticky mucus in the lungs, pancreas, and other organs.", symptoms:"Chronic respiratory infections, thick mucus buildup, digestive problems from pancreatic enzyme insufficiency.", diagnostic:"Newborn screening; sweat chloride test (elevated chloride in sweat is classic); genetic testing for CFTR mutations confirms diagnosis.", treatment:"Airway clearance therapy, pancreatic enzyme replacement, CFTR-modulator drugs that improve channel function in eligible mutations.", trap:"CF is a single-gene (CFTR) channel defect, not a chromosomal disorder, and it is autosomal recessive — both parents of an affected child must be carriers."}
]}

};
