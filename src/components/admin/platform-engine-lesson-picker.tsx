import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import { type FC, useMemo, useState } from 'react'
import { type AdminLesson } from './admin-data'
import { STEM_TOOL_LIBRARY, type StemToolDefinition } from '@/components/stem-lab/stem-tool-library'
import { engineForTopic, getCurriculumTopicKey, getMathTopic, STEM_CURRICULUM } from './stem-curriculum'
import { STEM_GRADE_BANDS, STEM_TOPICS, type StemGradeBand } from '@/components/stem-lab/stem-lab-data'
import { type PlatformEngineId } from '@/components/stem-lab/platform-engine-library'
import { PlatformEnginePreview } from '@/components/stem-lab/platform-engine-previews'

const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology'] as const
type SubjectFilter = typeof subjects[number]
const stages = ['All', 'Foundation', 'Core', 'Advanced', 'Applied lab'] as const
type StageFilter = typeof stages[number]
const grades = ['All', ...STEM_GRADE_BANDS, 'Unassigned'] as const
type GradeFilter = typeof grades[number]
const normalizeTopicTitle = (title: string) => title.toLowerCase().replace(/&/g, 'and').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '')
const getTopicGrade = (subject: string, title: string): StemGradeBand | 'Unassigned' => {
  const normalizedSubject = subject === 'Mathematics' ? 'Math' : subject
  return STEM_TOPICS.find((topic) => topic.subject === normalizedSubject && normalizeTopicTitle(topic.title) === normalizeTopicTitle(title))?.gradeBand ?? 'Unassigned'
}
const comingSoonChemistryTopics = new Set(['Salts', 'Laboratory Techniques & Safety', 'Mole Concept', 'Stoichiometry', 'Oxidation & Reduction', 'Organic Chemistry', 'Chemical Kinetics', 'Chemical Equilibrium', 'Solubility Equilibrium', 'Thermochemistry', 'Electrochemistry', 'Redox Chemistry', 'Hydrocarbons', 'Alcohols & Ethers', 'Aldehydes & Ketones', 'Carboxylic Acids', 'Polymers', 'Biochemistry', 'Environmental Chemistry'])
const comingSoonBiologyTopics = new Set(['Seeds & Germination', 'Animals Around Us', 'Healthy Habits', 'Habitats', 'Life Cycles', 'Human Body Systems', 'Cell Structure', 'Microscopes', 'Plant Reproduction', 'Respiration', 'Circulation', 'Biodiversity', 'Cell Biology', 'Biological Molecules', 'Enzymes', 'Cell Division', 'Genetics', 'Molecular Biology', 'Plant Physiology', 'Animal Physiology', 'Reproduction', 'Microbiology', 'Ecology', 'Ecosystems', 'Evolution', 'Molecular Genetics', 'DNA & RNA', 'Biotechnology', 'Human Reproduction', 'Immunology', 'Population Biology', 'Conservation Biology', 'Food Chains', 'Animal Classification'])

type TopicOption = {
  key: string
  title: string
  description: string
  subject: Exclude<SubjectFilter, 'All'>
  stage: Exclude<StageFilter, 'All'>
  gradeBand: StemGradeBand | 'Unassigned'
  platformEngineId: PlatformEngineId
  comingSoon?: boolean
  simulation?: StemToolDefinition
  activity?: ReturnType<typeof getMathTopic>
}

type PlatformEngineLessonPickerProps = {
  lesson: AdminLesson
  updateLessonDraft: (lesson: AdminLesson) => void
  onSave: (lesson?: AdminLesson) => void
}

const subjectDescription: Record<Exclude<SubjectFilter, 'All'>, string> = {
  Mathematics: 'Explore mathematics through specific, validated interactive challenges.',
  Physics: 'Explore forces, motion, energy, and the world around us.',
  Chemistry: 'Investigate matter, reactions, structure, and safe virtual experiments.',
  Biology: 'Discover living systems, structures, processes, and evidence.',
}

const topicOptions = (): TopicOption[] => {
  const topics = Object.entries(STEM_CURRICULUM).flatMap(([subject, titles]) => titles.map((title, index) => ({
    key: getCurriculumTopicKey(subject, title) ?? `${subject.toLowerCase()}-${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title,
    description: subject === 'Biology' && title === 'Photosynthesis' ? 'See how plants make their own food using sunlight.' : subject === 'Biology' && title === 'Cells' ? 'Discover that living things are made of tiny building blocks called cells.' : subject === 'Chemistry' && title === 'Chemical Formulae' ? 'Assemble the correct chemical formula from elements.' : subject === 'Chemistry' && title === 'Materials Around Us' ? 'Explore the everyday materials that make up our world.' : subject === 'Chemistry' && title === 'Solids/Liquids/Gases' ? 'Explore the three states of matter.' : subject === 'Chemistry' && title === 'Properties of Materials' ? "Compare materials by their physical properties, and explore what happens when they're mixed." : subject === 'Physics' && title === 'Momentum' ? 'Explore how momentum transfers in collisions.' : subject === 'Physics' && title === "Newton's Laws" ? 'Explore how force, mass, and motion relate.' : subject === 'Physics' && title === 'Vectors & Scalars' ? 'Explore the difference between vectors and scalars.' : subject === 'Physics' && title === 'Refraction' ? 'See how light bends through different materials.' : subject === 'Physics' && title === 'Speed & Velocity' ? 'Calculate and compare speed and velocity.' : subject === 'Physics' && title === 'Electricity' ? 'Build a working circuit.' : subject === 'Physics' && title === 'Semiconductor Electronics' ? 'Explore how semiconductor devices control current.' : subject === 'Physics' && title === 'Energy' ? 'Explore how energy transforms between forms.' : subject === 'Physics' && title === 'Simple Machines' ? 'Explore how simple machines make work easier.' : subject === 'Physics' && title === 'Magnets' ? 'Explore how magnets attract and repel.' : subject === 'Physics' && title === 'Floating & Sinking' ? 'Discover why some objects float and others sink.' : subject === 'Physics' && title === 'Forces & Motion' ? 'See how forces cause objects to move.' : subject === 'Physics' && title === 'Friction' ? 'Compare how friction differs across surfaces.' : subject === 'Physics' && title === 'Gravity' ? 'Explore how gravity pulls objects downward.' : subject === 'Physics' && title === 'Reflection' ? 'See how light reflects off mirrors.' : subject === 'Physics' && title === 'Heat & Cold' ? 'See how heat affects particle movement.' : subject === 'Physics' && title === 'Sound & Vibrations' ? 'Explore how vibrations create sound.' : subject === 'Physics' && title === 'Light & Shadows' ? 'See how light creates shadows.' : subject === 'Physics' && title === 'Fast & Slow' ? 'Compare the speeds of moving objects.' : subject === 'Physics' && title === 'Movement' ? 'Explore different types of movement.' : subject === 'Physics' && title === 'Push & Pull' ? 'Explore how pushing and pulling move objects.' : subject === 'Biology' && title === 'Living & Non-Living Things' ? 'Sort everyday objects into living and non-living groups.' : subject === 'Biology' && title === 'Plant Structure' ? "Explore how a plant's structure supports its function." : subject === 'Biology' && title === 'Human Body Parts' ? 'Identify major parts of the human body.' : subject === 'Biology' && title === 'Five Senses' ? 'Match situations to the sense used to experience them.' : subject === 'Biology' && title === 'Animals Around Us' ? 'Recognize and group common animals.' : subject === 'Biology' && title === 'Food & Nutrition' ? 'Build a balanced, healthy meal.' : subject === 'Mathematics' ? getMathTopic(title)?.description ?? subjectDescription[subject as Exclude<SubjectFilter, 'All'>] : subjectDescription[subject as Exclude<SubjectFilter, 'All'>],
    subject: subject as Exclude<SubjectFilter, 'All'>,
    stage: subject === 'Mathematics' ? getMathTopic(title)?.tier ?? 'Foundation' : index < Math.ceil(titles.length / 3) ? 'Foundation' as const : index < Math.ceil((titles.length * 2) / 3) ? 'Core' as const : 'Advanced' as const,
    gradeBand: getTopicGrade(subject, title),
    platformEngineId: engineForTopic(subject, title),
    comingSoon: (subject === 'Chemistry' && comingSoonChemistryTopics.has(title)) || (subject === 'Biology' && comingSoonBiologyTopics.has(title)),
    activity: subject === 'Mathematics' ? getMathTopic(title) : undefined,
  })))
  const labs: Array<{ subject: Exclude<SubjectFilter, 'All'>; title: string; toolId: string; comingSoon?: boolean }> = [
    { subject: 'Physics', title: 'Pendulum Experiment', toolId: 'pendulum-lab' },
    { subject: 'Physics', title: 'Projectile Motion', toolId: 'projectile-motion-lab' },
    { subject: 'Chemistry', title: 'Acids & Bases', toolId: 'neutralization-lab' },
    { subject: 'Biology', title: 'Osmosis', toolId: 'osmosis-lab', comingSoon: true },
  ]
  return [...topics, ...labs.map((lab) => {
    const simulation = STEM_TOOL_LIBRARY.find((tool) => tool.id === lab.toolId)
    return { key: `lab-${lab.toolId}`, title: lab.title, description: simulation?.description ?? subjectDescription[lab.subject], subject: lab.subject, stage: 'Applied lab' as const, gradeBand: getTopicGrade(lab.subject, lab.title), platformEngineId: lab.title === 'Projectile Motion' ? 'projectile-motion' as const : lab.subject === 'Chemistry' || lab.title === 'Osmosis' ? 'virtual-lab' as const : 'physics' as const, comingSoon: lab.comingSoon, simulation }
  })]
}

const PlatformEngineLessonPicker: FC<PlatformEngineLessonPickerProps> = ({ lesson, updateLessonDraft, onSave }) => {
  const [subject, setSubject] = useState<SubjectFilter>('All')
  const [stage, setStage] = useState<StageFilter>('All')
  const [grade, setGrade] = useState<GradeFilter>('All')
  const [search, setSearch] = useState('')
  const [legacyTopicDismissed, setLegacyTopicDismissed] = useState(false)
  const options = useMemo(topicOptions, [])
  const selectedKey = legacyTopicDismissed ? null : options.find((option) => option.title === lesson.title)?.key ?? lesson.curriculumTopic ?? null
  const filteredOptions = options.filter((option) => (subject === 'All' || option.subject === subject) && (stage === 'All' || option.stage === stage) && (grade === 'All' || option.gradeBand === grade) && `${option.title} ${option.subject} ${option.description}`.toLowerCase().includes(search.trim().toLowerCase()))
  const selectedOption = options.find((option) => option.key === selectedKey)
  const selectTopic = (option: TopicOption) => { if (option.comingSoon) return; setLegacyTopicDismissed(false); updateLessonDraft({ ...lesson, title: lesson.title.startsWith('New ') ? option.title : lesson.title, curriculumTopic: option.key, platformEngineId: option.platformEngineId, simulationToolId: option.simulation?.id ?? option.platformEngineId, simulation: option.simulation?.config }) }
  const saveSelectedTopic = () => {
    if (!selectedOption || selectedOption.comingSoon) return
    const normalizedLesson = { ...lesson, curriculumTopic: selectedOption.key, platformEngineId: selectedOption.platformEngineId, simulationToolId: selectedOption.simulation?.id ?? selectedOption.platformEngineId, simulation: selectedOption.simulation?.config }
    updateLessonDraft(normalizedLesson)
    onSave(normalizedLesson)
  }

  if (selectedOption) return <Stack spacing={2}>
    <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => { setLegacyTopicDismissed(true); updateLessonDraft({ ...lesson, curriculumTopic: undefined, platformEngineId: undefined, simulationToolId: '', simulation: undefined }) }} sx={{ alignSelf: 'flex-start' }}>Back to topic library</Button>
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'primary.main', backgroundColor: 'action.selected' }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}><Box><Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>Curriculum topic</Typography><Typography variant="h6">{selectedOption.title}</Typography><Typography variant="body2" color="text.secondary">{selectedOption.description}</Typography></Box><Stack direction="row" spacing={.75} flexWrap="wrap"><Chip label={selectedOption.subject} color="primary" /><Chip label={selectedOption.gradeBand} variant="outlined" /><Chip label={selectedOption.stage} variant="outlined" />{selectedOption.comingSoon && <Chip label="Coming soon" color="default" />}</Stack></Stack></Paper>
    <PlatformEnginePreview engineId={selectedOption.platformEngineId} mathTopic={selectedOption.activity} topicTitle={selectedOption.title} />
    {selectedOption.simulation && <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Guided activity ready</Typography><Typography variant="body2" color="text.secondary">{selectedOption.simulation.config.overview}</Typography></Paper>}
    <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={saveSelectedTopic} disabled={!lesson.title.trim() || selectedOption.comingSoon}>{selectedOption.comingSoon ? 'Coming soon' : 'Save topic as lesson'}</Button>
  </Stack>

  return <Stack spacing={1.5}>
    <Box><Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Choose a curriculum topic</Typography><Typography variant="body2" color="text.secondary">Pick the topic students will learn. The platform automatically attaches the right interactive activity.</Typography></Box>
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25}><TextField fullWidth size="small" label="Search topics" value={search} onChange={(event) => setSearch(event.target.value)} /><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Grade</InputLabel><Select label="Grade" value={grade} onChange={(event) => setGrade(event.target.value as GradeFilter)}>{grades.map((value) => <MenuItem key={value} value={value}>{value === 'All' ? 'All grades' : value}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Subject</InputLabel><Select label="Subject" value={subject} onChange={(event) => setSubject(event.target.value as SubjectFilter)}>{subjects.map((value) => <MenuItem key={value} value={value}>{value === 'All' ? 'All subjects' : value}</MenuItem>)}</Select></FormControl><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Stage</InputLabel><Select label="Stage" value={stage} onChange={(event) => setStage(event.target.value as StageFilter)}>{stages.map((value) => <MenuItem key={value} value={value}>{value === 'All' ? 'All stages' : value}</MenuItem>)}</Select></FormControl></Stack>
    <Grid container spacing={1.25}>{filteredOptions.map((option) => <Grid item xs={12} sm={6} key={option.key}><Box component="button" type="button" disabled={option.comingSoon} aria-disabled={option.comingSoon} onClick={() => selectTopic(option)} sx={{ width: '100%', minHeight: 132, p: 1.5, textAlign: 'left', border: 1, borderColor: 'divider', borderRadius: 2, backgroundColor: 'background.paper', color: 'text.primary', cursor: option.comingSoon ? 'not-allowed' : 'pointer', opacity: option.comingSoon ? .7 : 1, font: 'inherit', '&:hover': option.comingSoon ? {} : { borderColor: 'primary.main', backgroundColor: 'action.hover', transform: 'translateY(-2px)' }, transition: 'transform .18s ease, border-color .18s ease' }}><Stack spacing={.75}><Stack direction="row" justifyContent="space-between" spacing={1}><Typography sx={{ fontWeight: 700 }}>{option.title}</Typography><Chip size="small" label={option.subject} /></Stack><Typography variant="body2" color="text.secondary">{option.description}</Typography>{option.activity && <Box sx={{ mt: .25, p: 1, borderRadius: 1.5, backgroundColor: 'action.hover' }}><Typography variant="caption" color="primary.main" sx={{ display: 'block', fontWeight: 800 }}>{option.activity.activity}</Typography><Typography variant="caption" color="text.secondary">{option.activity.activityDescription}</Typography></Box>}<Stack direction="row" spacing={.75} alignItems="center"><Chip size="small" label={option.gradeBand} color={option.gradeBand === 'Unassigned' ? 'default' : 'primary'} variant="outlined" /><Chip size="small" label={option.stage} variant="outlined" />{option.comingSoon && <Chip size="small" label="Coming soon" />}</Stack></Stack></Box></Grid>)}</Grid>
    {!filteredOptions.length && <Typography color="text.secondary" sx={{ py: 2 }}>No curriculum topics match these filters.</Typography>}
  </Stack>
}

export default PlatformEngineLessonPicker
