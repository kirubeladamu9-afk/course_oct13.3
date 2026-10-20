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
import Select from '@mui/material/Select'
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

const CourseMarketplacePage: FC<CourseMarketplacePageProps> = ({ courses, darkMode, onToggleDarkMode, isLoading }) => {
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('popular')
  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [courses])
  const hasFilters = selectedCategories.length > 0 || minRating > 0 || minPrice !== '' || maxPrice !== ''
  const visibleCourses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return courses
      .filter((course) => selectedCategories.length === 0 || selectedCategories.includes(course.category))
      .filter((course) => course.rating >= minRating)
      .filter((course) => minPrice === '' || course.price >= Number(minPrice))
      .filter((course) => maxPrice === '' || course.price <= Number(maxPrice))
      .filter((course) => !query || `${course.title} ${course.description ?? ''} ${course.category}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        if (sortOrder === 'rating') return b.rating - a.rating || b.ratingCount - a.ratingCount
        if (sortOrder === 'price-low') return a.price - b.price
        if (sortOrder === 'price-high') return b.price - a.price
        if (sortOrder === 'title') return a.title.localeCompare(b.title)
        return b.ratingCount - a.ratingCount || b.rating - a.rating
      })
  }, [courses, maxPrice, minPrice, minRating, search, selectedCategories, sortOrder])

  const clearFilters = () => {
    setSearch('')
    setSelectedCategories([])
    setMinRating(0)
    setMinPrice('')
    setMaxPrice('')
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
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Minimum rating</Typography>
                <FormControl fullWidth size="small">
                  <Select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} inputProps={{ 'aria-label': 'Filter by minimum course rating' }}>
                    <MenuItem value={0}>Any rating</MenuItem>
                    <MenuItem value={4}>4 stars & up</MenuItem>
                    <MenuItem value={3}>3 stars & up</MenuItem>
                    <MenuItem value={2}>2 stars & up</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider />
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Price range</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField size="small" label="Min" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputProps={{ min: 0, 'aria-label': 'Minimum course price' }} />
                  <TextField size="small" label="Max" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputProps={{ min: 0, 'aria-label': 'Maximum course price' }} />
                </Stack>
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
