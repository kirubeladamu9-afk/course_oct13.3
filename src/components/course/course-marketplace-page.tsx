import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Rating from '@mui/material/Rating'
import Select from '@mui/material/Select'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type FC, useMemo, useState } from 'react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import CourseCardItem from './course-card-item'
import { type Course } from '@/interfaces/course'

interface CourseMarketplacePageProps {
  courses: Course[]
  darkMode: boolean
  onToggleDarkMode: () => void
  isLoading: boolean
}

type SortOrder = 'popular' | 'rating' | 'price-low' | 'price-high' | 'title'
type CourseType = 'Self-paced' | 'Live class' | 'Practice'

const getCourseTypes = (course: Course): CourseType[] => {
  const types: CourseType[] = []
  const lessonTypes = course.lessonTypes ?? []
  if (lessonTypes.some((type) => type !== 'live' && type !== 'practice')) types.push('Self-paced')
  if (lessonTypes.includes('live')) types.push('Live class')
  if (lessonTypes.includes('practice')) types.push('Practice')
  return types.length ? types : ['Self-paced']
}

const CourseMarketplacePage: FC<CourseMarketplacePageProps> = ({ courses, darkMode, onToggleDarkMode, isLoading }) => {
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedLevels, setSelectedLevels] = useState<string[]>([])
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<CourseType[]>([])
  const [minRating, setMinRating] = useState(0)
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('popular')
  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [courses])
  const levels = useMemo(() => Array.from(new Set(courses.map((course) => course.level).filter((level): level is string => Boolean(level)))).sort((a, b) => a.localeCompare(b)), [courses])
  const priceMaximum = Math.max(50, Math.ceil(Math.max(0, ...courses.map((course) => course.price)) / 50) * 50)
  const activePriceRange = priceRange ?? [0, priceMaximum]
  const hasFilters = selectedCategories.length > 0 || selectedLevels.length > 0 || selectedCourseTypes.length > 0 || minRating > 0 || activePriceRange[0] > 0 || activePriceRange[1] < priceMaximum
  const visibleCourses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return courses
      .filter((course) => selectedCategories.length === 0 || selectedCategories.includes(course.category))
      .filter((course) => selectedLevels.length === 0 || selectedLevels.includes(course.level ?? ''))
      .filter((course) => selectedCourseTypes.length === 0 || getCourseTypes(course).some((type) => selectedCourseTypes.includes(type)))
      .filter((course) => course.rating >= minRating)
      .filter((course) => course.price >= activePriceRange[0] && course.price <= activePriceRange[1])
      .filter((course) => !query || `${course.title} ${course.description ?? ''} ${course.category}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        if (sortOrder === 'rating') return b.rating - a.rating || b.ratingCount - a.ratingCount
        if (sortOrder === 'price-low') return a.price - b.price
        if (sortOrder === 'price-high') return b.price - a.price
        if (sortOrder === 'title') return a.title.localeCompare(b.title)
        return b.ratingCount - a.ratingCount || b.rating - a.rating
      })
  }, [activePriceRange, courses, minRating, search, selectedCategories, selectedCourseTypes, selectedLevels, sortOrder])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategories([])
    setSelectedLevels([])
    setSelectedCourseTypes([])
    setMinRating(0)
    setPriceRange(null)
  }

  const scrollToCatalog = () => document.getElementById('course-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    <Header darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
    <Box component="main">
      <Box sx={{ position: 'relative', overflow: 'hidden', color: 'common.white', background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(120deg, #102b3f 0%, #0b514b 100%)' : 'linear-gradient(120deg, #102b3f 0%, #12685d 68%, #168276 100%)' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', right: { xs: -240, md: -90 }, top: -225, border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 0 0 48px rgba(255,255,255,.035), 0 0 0 96px rgba(255,255,255,.025)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 9 } }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip icon={<AutoAwesomeOutlinedIcon />} label="THE COURSESPACE CATALOG" size="small" sx={{ mb: 2.5, px: 0.5, color: 'common.white', backgroundColor: 'rgba(255,255,255,.12)', '& .MuiChip-icon': { color: '#b9f0dd' }, fontWeight: 700, letterSpacing: '.06em' }} />
              <Typography component="h1" sx={{ maxWidth: 700, mb: 2, fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4rem' }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-.045em' }}>Find the course that moves you forward.</Typography>
              <Typography sx={{ maxWidth: 590, mb: 3.5, color: 'rgba(255,255,255,.78)', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7 }}>Explore practical learning experiences, discover new interests, and build skills at your own pace.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                <Button variant="contained" onClick={scrollToCatalog} endIcon={<ArrowForwardRoundedIcon />} sx={{ px: 2.5, py: 1.15, color: '#123e39', backgroundColor: '#c8f1df', fontWeight: 700, '&:hover': { backgroundColor: '#a9e7ce' } }}>Explore courses</Button>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.72)' }}>{isLoading ? 'Loading the catalog…' : `${courses.length} ${courses.length === 1 ? 'course' : 'courses'} to explore`}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, border: 1, borderColor: 'rgba(255,255,255,.18)', borderRadius: 3.5, color: 'common.white', backgroundColor: 'rgba(255,255,255,.09)', backdropFilter: 'blur(8px)' }}>
                <Box sx={{ display: 'grid', placeItems: 'center', width: 48, height: 48, mb: 2.5, borderRadius: 2, color: '#c8f1df', backgroundColor: 'rgba(255,255,255,.12)' }}><SchoolOutlinedIcon /></Box>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 750 }}>Learning that fits your next step</Typography>
                <Typography variant="body2" sx={{ mb: 2.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.65 }}>Browse the catalog, compare course details, and find a learning path that matches your goals.</Typography>
                <Stack direction="row" spacing={1} alignItems="center"><StarRoundedIcon sx={{ color: '#f6cb68', fontSize: 19 }} /><Typography variant="body2" sx={{ color: 'rgba(255,255,255,.82)' }}>Ratings and course information from learners</Typography></Stack>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container id="course-catalog" maxWidth="lg" sx={{ py: { xs: 5, md: 7 }, scrollMarginTop: 24 }}>
        <Box sx={{ mb: 3.5 }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1.25 }}>Browse and discover</Typography>
          <Typography component="h2" variant="h4" sx={{ mt: 0.25, fontWeight: 800, letterSpacing: '-.035em' }}>Explore all courses</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>Search the catalog or browse by subject to find your next course.</Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
          <TextField fullWidth value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses, topics, or skills" aria-label="Search courses" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper', borderRadius: 2 } }} />
          <FormControl size="small" sx={{ width: { xs: '100%', md: 210 }, flexShrink: 0 }}>
            <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} inputProps={{ 'aria-label': 'Sort courses' }} sx={{ minHeight: 56, backgroundColor: 'background.paper', borderRadius: 2 }}>
              <MenuItem value="popular">Most popular</MenuItem>
              <MenuItem value="rating">Top rated</MenuItem>
              <MenuItem value="price-low">Price: low to high</MenuItem>
              <MenuItem value="price-high">Price: high to low</MenuItem>
              <MenuItem value="title">Course name</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        <Grid container spacing={{ xs: 2.5, md: 3 }} alignItems="flex-start">
          <Grid item xs={12} md={3}>
            <Paper elevation={0} component="aside" aria-label="Course filters" sx={{ p: { xs: 2, sm: 2.5 }, border: 1, borderColor: 'divider', borderRadius: 3, backgroundColor: 'background.paper', position: { md: 'sticky' }, top: { md: 24 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 750 }}>Filters</Typography>
                {(hasFilters || search) && <Button size="small" onClick={clearFilters}>Clear all</Button>}
              </Stack>
              <Divider />
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Subject</Typography>
                {categories.length ? <FormGroup>
                  {categories.map((category) => <FormControlLabel key={category} control={<Checkbox size="small" checked={selectedCategories.includes(category)} onChange={(event) => setSelectedCategories((current) => event.target.checked ? [...current, category] : current.filter((value) => value !== category))} />} label={<Typography variant="body2">{category} <Typography component="span" variant="caption" color="text.secondary">({courses.filter((course) => course.category === category).length})</Typography></Typography>} sx={{ ml: 0, mr: 0, minHeight: 34 }} />)}
                </FormGroup> : <Typography variant="body2" color="text.secondary">No subjects available</Typography>}
              </Box>
              <Divider />
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>Price range</Typography>
                <Typography variant="caption" color="text.secondary">${activePriceRange[0]} – ${activePriceRange[1]}</Typography>
                <Slider aria-label="Course price range" value={activePriceRange} min={0} max={priceMaximum} step={1} onChange={(_, value) => { if (Array.isArray(value)) setPriceRange([value[0], value[1]]) }} valueLabelDisplay="auto" valueLabelFormat={(value) => `$${value}`} sx={{ mt: 1, mb: 0.5, color: 'primary.main' }} />
                <Stack direction="row" justifyContent="space-between"><Typography variant="caption" color="text.secondary">Min</Typography><Typography variant="caption" color="text.secondary">Max</Typography></Stack>
              </Box>
              <Divider />
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Level</Typography>
                {levels.length ? <FormGroup>{levels.map((level) => <FormControlLabel key={level} control={<Checkbox size="small" checked={selectedLevels.includes(level)} onChange={(event) => setSelectedLevels((current) => event.target.checked ? [...current, level] : current.filter((value) => value !== level))} />} label={<Typography variant="body2">{level} <Typography component="span" variant="caption" color="text.secondary">({courses.filter((course) => course.level === level).length})</Typography></Typography>} sx={{ ml: 0, mr: 0, minHeight: 34 }} />)}</FormGroup> : <Typography variant="body2" color="text.secondary">No difficulty levels available</Typography>}
              </Box>
              <Divider />
              <Box sx={{ py: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Course type</Typography>
                <FormGroup>{(['Self-paced', 'Live class', 'Practice'] as CourseType[]).map((type) => <FormControlLabel key={type} control={<Checkbox size="small" checked={selectedCourseTypes.includes(type)} onChange={(event) => setSelectedCourseTypes((current) => event.target.checked ? [...current, type] : current.filter((value) => value !== type))} />} label={<Typography variant="body2">{type} <Typography component="span" variant="caption" color="text.secondary">({courses.filter((course) => getCourseTypes(course).includes(type)).length})</Typography></Typography>} sx={{ ml: 0, mr: 0, minHeight: 34 }} />)}</FormGroup>
              </Box>
              <Divider />
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Ratings</Typography>
                <RadioGroup aria-label="Filter by minimum course rating" value={String(minRating)} onChange={(event) => setMinRating(Number(event.target.value))}>
                  {[4.5, 4, 3.5, 3].map((rating) => <FormControlLabel key={rating} value={String(rating)} control={<Radio size="small" />} label={<Stack direction="row" alignItems="center" spacing={0.75}>
                    <Rating value={rating} precision={0.5} readOnly size="small" sx={{ color: '#c18120', fontSize: 16 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{rating.toFixed(1)} & up</Typography>
                    <Typography variant="caption" color="text.secondary">({courses.filter((course) => course.rating >= rating).length.toLocaleString()})</Typography>
                  </Stack>} sx={{ ml: 0, mr: 0, minHeight: 42 }} />)}
                </RadioGroup>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            {isLoading ? <Box aria-busy="true" sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">Loading courses…</Typography></Box> : visibleCourses.length ? <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Showing <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{visibleCourses.length}</Box> {visibleCourses.length === 1 ? 'course' : 'courses'}</Typography>
                {(hasFilters || search) && <Button size="small" onClick={clearFilters}>Clear filters</Button>}
              </Stack>
              <Grid container spacing={0}>
                {visibleCourses.map((course) => <Grid item xs={12} sm={6} md={4} key={course.id}><CourseCardItem item={course} /></Grid>)}
              </Grid>
            </> : <Paper variant="outlined" sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: 3, backgroundColor: 'background.paper' }}>
              <SearchRoundedIcon color="disabled" sx={{ fontSize: 38 }} />
              <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>No courses match your filters</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Try another keyword or adjust your filters to see more courses.</Typography>
              <Button variant="outlined" onClick={clearFilters}>Show all courses</Button>
            </Paper>}
          </Grid>
        </Grid>
      </Container>
    </Box>
    <Footer />
  </Box>
}

export default CourseMarketplacePage
