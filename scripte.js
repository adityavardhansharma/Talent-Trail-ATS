// Replace with your actual API key
const API_KEY = 'AIzaSyDxz1Uy-033ywvHJQOhpMwvPTgZg-8yGmc';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

let pdfContent = null;

document.addEventListener('DOMContentLoaded', () => {
    const resumeUpload = document.getElementById('resumeUpload');
    const tellMeAboutResume = document.getElementById('tellMeAboutResume');
    const createSkillMatchTable = document.getElementById('createSkillMatchTable');
    const percentageMatch = document.getElementById('percentageMatch');
    const projectAndCertification = document.getElementById('projectAndCertification');

    resumeUpload.addEventListener('change', handleFileUpload);
    tellMeAboutResume.addEventListener('click', () => handleButtonClick('Tell Me About the Resume'));
    createSkillMatchTable.addEventListener('click', () => handleButtonClick('Create A Skill Match Table'));
    percentageMatch.addEventListener('click', () => handleButtonClick('Percentage Match'));
    projectAndCertification.addEventListener('click', () => handleButtonClick('Project & Certification'));

    // Animate buttons on hover
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            gsap.to(button, { scale: 1.05, duration: 0.3, ease: 'power2.out' });
        });
        button.addEventListener('mouseleave', () => {
            gsap.to(button, { scale: 1, duration: 0.3, ease: 'power2.out' });
        });
    });

    // Animate hero section on load
    gsap.from('.hero__title', { opacity: 0, y: 50, duration: 1, ease: 'power3.out' });
    gsap.from('.hero__subtitle', { opacity: 0, y: 50, duration: 1, ease: 'power3.out', delay: 0.3 });
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const uploadedFile = document.getElementById('uploadedFile');
        uploadedFile.textContent = file.name;
        gsap.from(uploadedFile, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });

        const reader = new FileReader();
        reader.onload = function(e) {
            pdfContent = e.target.result.split(',')[1]; // Get base64 content
        };
        reader.readAsDataURL(file);
    }
}

async function handleButtonClick(buttonType) {
    const jobDescription = document.getElementById('jobDescription').value;
    if (!jobDescription || !pdfContent) {
        showNotification('Please enter a job description and upload a resume.', 'error');
        return;
    }
    showResponseContainer();

    const prompt = getPrompt(buttonType);
    try {
        showLoadingIndicator();
        const response = await getGeminiResponse(prompt, pdfContent, jobDescription);
        const responseElement = document.getElementById('response');
        responseElement.innerHTML = marked.parse(response);

        // Animate the response container
        gsap.from(responseElement, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
    } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    } finally {
        hideLoadingIndicator();
    }
}

function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');
    gsap.from(loadingIndicator, { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power2.out' });
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    gsap.to(loadingIndicator, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => loadingIndicator.classList.add('hidden')
    });
}

function showResponseContainer() {
    const responseContainer = document.getElementById('responseContainer');
    responseContainer.classList.remove('hidden');
    gsap.from(responseContainer, { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' });
}

function getPrompt(buttonType) {
    switch (buttonType) {
        case 'Tell Me About the Resume':
            return `You are an experienced Technical Human Resource Manager. Your task is to review the provided resume against the job description. 
                    Please share your professional evaluation on whether the candidate's profile aligns with the role. 
                    Highlight the strengths and weaknesses of the applicant in relation to the specified job requirements and qualifications & responsibilities if required.
                    Format your response using Markdown for better readability. Use headers, bullet points, and bold text where appropriate.`;
        case 'Create A Skill Match Table':
            return `Given a resume and a job description, generate a table illustrating the match. 
                    Use cues to represent high, medium, and low match areas, highlighting strengths and weaknesses.
                    Format your response using Markdown, including a properly formatted Markdown table. Use headers and explanatory text as needed.`;
        case 'Percentage Match':
            return `You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality. 
                    Your task is to evaluate the resume against the provided job description and qualifications and requirements if given. 
                    Give me the percentage of match if the resume matches the job description. 
                    First, the output should come as a percentage and then keywords missing, and lastly final thoughts.
                    Format your response using Markdown for better readability. Use headers, bold text, and lists to structure your response.`;
        case 'Project & Certification':
            return `You are a skilled ATS (Applicant Tracking System) scanner with a deep understanding of data science and ATS functionality. 
                    Your task is to evaluate the resume against the provided job description and qualifications and requirements if given. 
                    Then tell about some advanced projects ideas telling what skilsets will be applied in them or certifications that he can add to his resume.
                    Format your response using Markdown for better readability. Use headers, bullet points, and bold text to structure your suggestions.`;
    }
}

async function getGeminiResponse(prompt, pdfContent, jobDescription) {
    const requestBody = {
        contents: [
            {
                parts: [
                    {text: prompt},
                    {text: jobDescription},
                    {inlineData: {mimeType: "application/pdf", data: pdfContent}}
                ]
            }
        ],
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
            stopSequences: []
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    gsap.fromTo(notification,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );

    setTimeout(() => {
        gsap.to(notification, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => notification.remove()
        });
    }, 3000);
}