window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

$(document).ready(function() {
    // Initialize carousel if available
    if (typeof bulmaCarousel !== 'undefined') {
        var options = {
            slidesToScroll: 1,
            slidesToShow: 1,
            loop: true,
            infinite: true,
            autoplay: true,
            autoplaySpeed: 5000,
        }
        bulmaCarousel.attach('.carousel', options);
    }

    if (typeof bulmaSlider !== 'undefined') {
        bulmaSlider.attach();
    }

    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();

    // Load Dynamic Guidance examples
    loadExamples();

    // Initialize denoising chart
    initDenoisingChart();
})

// Dynamic Guidance Examples
async function loadExamples() {
    const container = document.getElementById('examples-container');
    if (!container) return;

    try {
        const response = await fetch('data/examples.json');
        const data = await response.json();
        container.innerHTML = data.examples.map(renderExample).join('');

        // Preload all images for snappy swapping
        data.examples.forEach(example => {
            const baselineImg = new Image();
            baselineImg.src = `images/${example.id}/baseline.png`;
            const dynamicImg = new Image();
            dynamicImg.src = `images/${example.id}/dynamic.png`;
        });
    } catch (error) {
        container.innerHTML = `<div class="notification is-danger">Error loading examples: ${error.message}</div>`;
    }
}

function renderExample(example) {
    const baselineAnnotations = renderAnnotations(example.annotations?.baseline || [], 'red', true);
    const dynamicAnnotations = renderAnnotations(example.annotations?.dynamic || [], 'green', false);

    return `
        <div class="column is-one-third">
            <div class="example-card">
                <p class="example-prompt">"${example.prompt}"</p>

                <div class="image-wrapper baseline"
                     data-id="${example.id}"
                     data-state="baseline"
                     onclick="toggleImage(this)">
                    <img src="images/${example.id}/baseline.png"
                         data-baseline="images/${example.id}/baseline.png"
                         data-dynamic="images/${example.id}/dynamic.png"
                         alt="${example.prompt}">
                    <span class="image-label">Baseline (SD 2.1)</span>
                    <div class="annotations-baseline">${baselineAnnotations}</div>
                    <div class="annotations-dynamic" style="display:none;">${dynamicAnnotations}</div>
                </div>
                <p class="click-hint">Click to swap to Dynamic Guidance</p>
            </div>
        </div>
    `;
}

function renderAnnotations(annotations, color, showTooltip) {
    return annotations.map(ann => `
        <div class="annotation ${color}"
             style="left: ${ann.region.x}%; top: ${ann.region.y}%; width: ${ann.region.width}%; height: ${ann.region.height}%;">
            ${showTooltip && ann.description ? `<div class="annotation-tooltip">${ann.description}</div>` : ''}
        </div>
    `).join('');
}

function toggleImage(wrapper) {
    const img = wrapper.querySelector('img');
    const label = wrapper.querySelector('.image-label');
    const hint = wrapper.nextElementSibling;
    const baselineAnns = wrapper.querySelector('.annotations-baseline');
    const dynamicAnns = wrapper.querySelector('.annotations-dynamic');
    const state = wrapper.dataset.state;

    if (state === 'baseline') {
        img.src = img.dataset.dynamic;
        wrapper.classList.remove('baseline');
        wrapper.classList.add('dynamic');
        wrapper.dataset.state = 'dynamic';
        label.textContent = 'Dynamic Guidance';
        hint.textContent = 'Click to swap to Baseline';
        baselineAnns.style.display = 'none';
        dynamicAnns.style.display = '';
    } else {
        img.src = img.dataset.baseline;
        wrapper.classList.remove('dynamic');
        wrapper.classList.add('baseline');
        wrapper.dataset.state = 'baseline';
        label.textContent = 'Baseline (SD 2.1)';
        hint.textContent = 'Click to swap to Dynamic Guidance';
        baselineAnns.style.display = '';
        dynamicAnns.style.display = 'none';
    }
}

// Interactive plot with hover images
function initDenoisingChart() {
    // Plot 1 config
    initPlot({
        containerId: 'plotImageContainer',
        hoverContainerId: 'hoverImageContainer',
        sliderId: 'stepSlider',
        imageFolder: 'images/plot',
        greenIndices: [0, 1, 2, 10],
        defaultStep: 7,
        points: [
            { x: 16.5, y: 50 },
            { x: 22, y: 50 },
            { x: 27.5, y: 50 },
            { x: 33, y: 50 },
            { x: 38.5, y: 50 },
            { x: 44, y: 50 },
            { x: 49.5, y: 50 },
            { x: 55, y: 50 },
            { x: 60.5, y: 50 },
            { x: 66, y: 50 },
            { x: 71.5, y: 50 }
        ]
    });

    // Plot 2 config
    initPlot({
        containerId: 'plotImageContainer2',
        hoverContainerId: 'hoverImageContainer2',
        sliderId: 'stepSlider2',
        imageFolder: 'images/plot2',
        greenIndices: [],
        defaultStep: 7,
        points: [
            { x: 10, y: 56 },
            { x: 18, y: 56 },
            { x: 26, y: 56 },
            { x: 34, y: 56 },
            { x: 42, y: 56 },
            { x: 50, y: 56 },
            { x: 58, y: 56 },
            { x: 66, y: 56 },
            { x: 74, y: 56 },
            { x: 82, y: 56 },
            { x: 90, y: 56 }
        ]
    });
}

function initPlot(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return;

    const hoverContainer = document.getElementById(config.hoverContainerId);
    const slider = document.getElementById(config.sliderId);
    const greenIndices = config.greenIndices || [];

    // Build points with images
    const points = config.points.map((p, i) => ({
        ...p,
        image: `${config.imageFolder}/step_${i}.png`
    }));

    // Function to update display for a given index
    function setActiveStep(idx) {
        const img = hoverContainer.querySelector('img');
        const placeholder = hoverContainer.querySelector('.placeholder-text');

        img.src = points[idx].image;
        img.classList.add('visible');
        if (placeholder) placeholder.style.display = 'none';

        // Set background color
        const isGreen = greenIndices.includes(idx);
        hoverContainer.classList.remove('bg-green', 'bg-red');
        hoverContainer.classList.add(isGreen ? 'bg-green' : 'bg-red');

        // Highlight active dot
        container.querySelectorAll('.plot-point').forEach(p => p.classList.remove('active'));
        const activeDot = container.querySelector(`[data-index="${idx}"]`);
        if (activeDot) activeDot.classList.add('active');

        // Sync slider
        if (slider) slider.value = idx;
    }

    // Create hover points
    points.forEach((point, i) => {
        const dot = document.createElement('div');
        const isGreen = greenIndices.includes(i);
        dot.className = 'plot-point ' + (isGreen ? 'green' : 'red');
        dot.style.left = point.x + '%';
        dot.style.top = point.y + '%';
        dot.dataset.index = i;
        container.appendChild(dot);

        dot.addEventListener('mouseenter', () => setActiveStep(i));
    });

    // Slider input handler
    if (slider) {
        slider.addEventListener('input', () => setActiveStep(parseInt(slider.value)));
    }

    hoverContainer.innerHTML = `
        <img src="${config.imageFolder}/step_${config.defaultStep}.png" alt="Step image" class="visible">
    `;

    // Set default step as active
    setActiveStep(config.defaultStep);
}
