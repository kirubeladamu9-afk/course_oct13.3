import React, { FC, useRef } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Slider, { Settings } from 'react-slick'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import IconArrowBack from '@mui/icons-material/ArrowBack'
import IconArrowForward from '@mui/icons-material/ArrowForward'

import { TestimonialItem } from '@/components/testimonial'
import { data } from './testimonial.data'

const StyledSlickContainer = styled('div')(() => ({
  position: 'relative',

  '& .slick-list': { marginLeft: '-30px' },
}))

const HomeTestimonial: FC = () => {
  const sliderRef = useRef<Slider | null>(null)

  const sliderConfig: Settings = {
    infinite: true,
    autoplay: true,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  }

  return (
    <Box id="testimonial" sx={{ pb: { xs: 6, md: 10 }, backgroundColor: 'background.paper' }}>
      <Container>
        <Grid container spacing={5}>
          <Grid item xs={12} md={6}>
            <Typography
              component="h2"
              sx={{
                position: 'relative',
                fontSize: { xs: 36, md: 46 },
                mt: { xs: 0, md: 7 },
                mb: 4,
                lineHeight: 1,
                fontWeight: 'bold',
              }}
            >
              What Our{' '}
              <Typography
                component="mark"
                sx={{
                  position: 'relative',
                  color: 'primary.main',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  backgroundColor: 'unset',
                }}
              >
                Parents{' '}
                <Box
                  sx={{
                    position: 'absolute',
                    top: { xs: 20, md: 28 },
                    left: 2,
                    '& img': { width: { xs: 130, md: 175 }, height: 'auto' },
                  }}
                >
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <img src="/images/headline-curve.svg" alt="Headline curve" />
                </Box>
              </Typography>
              Are Saying Now
            </Typography>

            <StyledSlickContainer>
              <Slider ref={sliderRef} {...sliderConfig}>
                {data.map((item, index) => (
                  <TestimonialItem key={String(index)} item={item} />
                ))}
              </Slider>
            </StyledSlickContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <IconButton
                sx={{
                  backgroundColor: 'background.paper',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' },
                  boxShadow: 1,
                }}
                disableRipple
                aria-label="Previous testimonials"
                onClick={() => sliderRef.current?.slickPrev()}
              >
                <IconArrowBack sx={{ fontSize: 22 }} />
              </IconButton>
              <IconButton
                sx={{
                  backgroundColor: 'background.paper',
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.main', color: 'primary.contrastText' },
                  boxShadow: 1,
                }}
                disableRipple
                aria-label="Next testimonials"
                onClick={() => sliderRef.current?.slickNext()}
              >
                <IconArrowForward sx={{ fontSize: 22 }} />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ width: { xs: '100%', md: '90%' } }}>
              <img
                src="/images/home-testimonial.png"
                width={520}
                height={540}
                alt="Testimonial img"
                loading="lazy"
                style={{ width: '100%', height: 'auto' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default HomeTestimonial
