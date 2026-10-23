import { type SimulationConfig } from '@/components/admin/admin-data'
import { getStemTool } from './stem-tool-library'

export type StemSubject = 'Math' | 'Physics' | 'Chemistry' | 'Biology'
export type StemGradeBand = 'Grade 1–2' | 'Grade 3–5' | 'Grade 6–8' | 'Grade 9–10' | 'Grade 11–12'
export type StemTool = 'Interactive Diagram' | 'Calculator' | 'Graph' | 'Periodic Table' | 'Chemical Equation' | 'Number Line' | 'Counting Visualizer' | 'Shape Matcher' | 'Drag & Drop' | 'Matching' | 'Fraction Visualizer' | 'Geometry Builder' | 'Pendulum Lab' | 'Neutralization Lab' | 'Osmosis Lab' | 'Projectile Motion Lab'

export interface StemTopic {
  id: string
  subject: StemSubject
  gradeBand: StemGradeBand
  additionalGradeBands?: StemGradeBand[]
  difficultyBand: StemGradeBand
  title: string
  overview: string
  tools: StemTool[]
  activitySteps: string[]
  status: 'available' | 'coming-soon'
  simulation?: SimulationConfig
}

export const STEM_GRADE_BANDS: StemGradeBand[] = ['Grade 1–2', 'Grade 3–5', 'Grade 6–8', 'Grade 9–10', 'Grade 11–12']
export const STEM_SUBJECTS: StemSubject[] = ['Math', 'Physics', 'Chemistry', 'Biology']

const slugify = (value: string) => value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const activityFor = (title: string) => [`Explore the animated ${title} model`, 'Adjust the variables and interact with the model', 'Explain and check what changed']
type TopicEntry = { title: string; gradeBand: StemGradeBand; additionalGradeBands?: StemGradeBand[] }
const entries = (gradeBand: StemGradeBand, titles: string[], additionalBands: Record<string, StemGradeBand[]> = {}) => titles.map((title) => ({ title, gradeBand, ...(additionalBands[title] ? { additionalGradeBands: additionalBands[title] } : {}) }))

const catalog: Record<StemSubject, TopicEntry[]> = {
  Math: [
    ...entries('Grade 1–2', ['Counting & Number Recognition', 'Comparing Numbers', 'Addition & Subtraction', 'Place Value', 'Multiplication/Division Concepts', 'Patterns', 'Money', 'Time', 'Measurement', 'Shapes Around Us']),
    ...entries('Grade 3–5', ['Fractions', 'Decimals', 'Factors & Multiples', 'Ratios', 'Percentages', 'Geometry', 'Angles', 'Perimeter & Area', 'Symmetry', 'Coordinate Grids', 'Data & Statistics', 'Probability']),
    ...entries('Grade 6–8', ['Integers', 'Algebra', 'Linear Equations', 'Functions', 'Simultaneous Equations', 'Pythagorean Theorem', 'Transformations', 'Area & Volume']),
    ...entries('Grade 9–10', ['Sets', 'Similarity', 'Quadratic Equations', 'Sequences & Series', 'Trigonometry', 'Coordinate Geometry', 'Mathematical Modelling']),
    ...entries('Grade 11–12', ['Polynomial Functions', 'Exponential & Logarithmic Functions', 'Analytical Geometry', 'Vectors', 'Limits', 'Differentiation', 'Integration', 'Advanced Algebra']),
  ],
  Physics: [
    ...entries('Grade 1–2', ['Push & Pull', 'Movement', 'Fast & Slow', 'Light & Shadows', 'Sound & Vibrations', 'Heat & Cold', 'Magnets', 'Floating & Sinking']),
    ...entries('Grade 3–5', ['Forces & Motion', 'Friction', 'Gravity', 'Reflection', 'Simple Machines', 'Measuring Motion', 'Force', 'Energy', 'Electricity', 'Measurement', 'Motion', 'Work', 'Heat Transfer']),
    ...entries('Grade 6–8', ['Pressure', 'Speed & Velocity', 'Refraction']),
    ...entries('Grade 9–10', ['Vectors & Scalars', 'Linear Motion', 'Newton’s Laws', 'Momentum', 'Gravitation', 'Properties of Matter', 'Waves', 'Kinematics', 'Dynamics', 'Circular Motion', 'Fluid Mechanics', 'Thermal Physics', 'Projectile Motion']),
    ...entries('Grade 11–12', ['Oscillations', 'Pendulum Experiment', 'Electrostatics', 'Current Electricity', 'Magnetism', 'Electromagnetic Induction', 'Modern Physics', 'Nuclear Physics', 'Semiconductor Electronics'], { Magnetism: ['Grade 1–2'] }),
  ],
  Chemistry: [
    ...entries('Grade 1–2', ['Materials Around Us', 'Solids/Liquids/Gases', 'Properties of Materials', 'Dissolving', 'Changes in Materials']),
    ...entries('Grade 3–5', ['Matter', 'States of Matter', 'Solutions', 'Separation Methods', 'Water Chemistry', 'Chemical Safety']),
    ...entries('Grade 6–8', ['Atomic Structure', 'Elements & Compounds', 'Chemical Reactions', 'Indicators', 'Metals & Non-Metals', 'Periodic Table', 'Chemical Bonding', 'Chemical Formulae', 'Salts']),
    ...entries('Grade 9–10', ['Laboratory Techniques & Safety', 'Mole Concept', 'Stoichiometry', 'Acids & Bases', 'Oxidation & Reduction', 'Organic Chemistry']),
    ...entries('Grade 11–12', ['Chemical Kinetics', 'Chemical Equilibrium', 'Solubility Equilibrium', 'Thermochemistry', 'Electrochemistry', 'Redox Chemistry', 'Hydrocarbons', 'Alcohols & Ethers', 'Aldehydes & Ketones', 'Carboxylic Acids', 'Polymers', 'Biochemistry', 'Environmental Chemistry']),
  ],
  Biology: [
    ...entries('Grade 1–2', ['Living & Non-Living Things', 'Parts of Plants', 'Seeds & Germination', 'Animals Around Us', 'Human Body Parts', 'Five Senses', 'Food & Nutrition', 'Healthy Habits', 'Habitats', 'Life Cycles']),
    ...entries('Grade 3–5', ['Plant Structure', 'Photosynthesis', 'Animal Classification', 'Cells', 'Human Body Systems', 'Ecosystems', 'Food Chains', 'Plant Reproduction', 'Respiration'], { Photosynthesis: ['Grade 6–8'] }),
    ...entries('Grade 6–8', ['Cell Structure', 'Microscopes', 'Circulation', 'Biodiversity', 'Cell Biology']),
    ...entries('Grade 9–10', ['Biological Molecules', 'Enzymes', 'Cell Division', 'Genetics', 'Plant Physiology', 'Animal Physiology', 'Reproduction', 'Ecology', 'Evolution', 'Osmosis']),
    ...entries('Grade 11–12', ['Molecular Biology', 'Microbiology', 'Molecular Genetics', 'DNA & RNA', 'Biotechnology', 'Human Reproduction', 'Immunology', 'Population Biology', 'Conservation Biology']),
  ],
}

const subjectTools: Record<StemSubject, StemTool[]> = {
  Math: ['Calculator', 'Graph', 'Geometry Builder'],
  Physics: ['Interactive Diagram', 'Graph', 'Calculator'],
  Chemistry: ['Interactive Diagram', 'Chemical Equation', 'Calculator'],
  Biology: ['Interactive Diagram', 'Graph', 'Drag & Drop'],
}

const makeTopic = (subject: StemSubject, entry: TopicEntry): StemTopic => {
  const { title, gradeBand, additionalGradeBands } = entry
  const tool: StemTool | undefined = subject === 'Physics' && title === 'Pendulum Experiment' ? 'Pendulum Lab' : subject === 'Physics' && title === 'Projectile Motion' ? 'Projectile Motion Lab' : subject === 'Chemistry' && title === 'Acids & Bases' ? 'Neutralization Lab' : subject === 'Biology' && title === 'Osmosis' ? 'Osmosis Lab' : undefined
  const simulation = tool === 'Pendulum Lab' ? getStemTool('pendulum-lab')?.config : tool === 'Projectile Motion Lab' ? getStemTool('projectile-motion-lab')?.config : tool === 'Neutralization Lab' ? getStemTool('neutralization-lab')?.config : tool === 'Osmosis Lab' ? getStemTool('osmosis-lab')?.config : undefined
  const tools = tool ? [tool, ...subjectTools[subject].slice(0, 2)] : subjectTools[subject]
  const overview = subject === 'Physics' && title === 'Forces & Motion' ? 'See how forces cause objects to move.' : subject === 'Physics' && title === 'Friction' ? 'Compare how friction differs across surfaces.' : subject === 'Physics' && title === 'Gravity' ? 'Explore how gravity pulls objects downward.' : subject === 'Physics' && title === 'Reflection' ? 'See how light reflects off mirrors.' : `Build an animated, interactive understanding of ${title.toLowerCase()} through guided exploration and observable results.`
  return {
    id: `${subject.toLowerCase()}-${slugify(title)}`,
    subject,
    gradeBand,
    ...(additionalGradeBands ? { additionalGradeBands } : {}),
    difficultyBand: gradeBand,
    title,
    overview,
    tools,
    activitySteps: activityFor(title),
    status: 'available',
    ...(simulation ? { simulation } : {}),
  }
}

export const STEM_TOPICS: StemTopic[] = STEM_SUBJECTS.flatMap((subject) => catalog[subject].map((entry) => makeTopic(subject, entry)))
