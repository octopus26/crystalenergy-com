// Shopping Cart Functionality
class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartDisplay();
    }

    bindEvents() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product');
                this.addToCart(productId);
            });
        });

        // Cart modal events
        const cartIcon = document.querySelector('.nav-cart');
        const cartModal = document.getElementById('cartModal');
        const closeModal = document.querySelector('.close');
        const continueShopping = document.getElementById('continueShopping');

        cartIcon.addEventListener('click', () => {
            this.showCartModal();
        });

        closeModal.addEventListener('click', () => {
            this.hideCartModal();
        });

        continueShopping.addEventListener('click', () => {
            this.hideCartModal();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                this.hideCartModal();
            }
        });

        // Checkout button
        document.getElementById('checkout').addEventListener('click', () => {
            this.checkout();
        });
    }

    addToCart(productId) {
        const products = {
            'amethyst-bracelet': {
                id: 'amethyst-bracelet',
                name: 'Amethyst Bracelet',
                price: 49.99,
                description: 'Enhance spiritual awareness and protection'
            },
            'rose-quartz-pendant': {
                id: 'rose-quartz-pendant',
                name: 'Rose Quartz Pendant',
                price: 34.99,
                description: 'Attract love and emotional healing'
            },
            'citrine-stone': {
                id: 'citrine-stone',
                name: 'Citrine Wealth Stone',
                price: 59.99,
                description: 'Boost prosperity and abundance'
            },
            'black-tourmaline': {
                id: 'black-tourmaline',
                name: 'Black Tourmaline Shield',
                price: 39.99,
                description: 'Protection from negative energy'
            }
        };

        const product = products[productId];
        if (product) {
            // Check if item already exists in cart
            const existingItem = this.items.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    ...product,
                    quantity: 1
                });
            }

            this.updateCartDisplay();
            this.showAddedToCartAnimation();
        }
    }

    removeFromCart(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.updateCartDisplay();
        this.updateCartModal();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.updateCartDisplay();
                this.updateCartModal();
            }
        }
    }

    calculateTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        const totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Update cart total
        this.total = this.calculateTotal();
        const cartTotal = document.getElementById('cartTotal');
        if (cartTotal) {
            cartTotal.textContent = this.total.toFixed(2);
        }
    }

    showCartModal() {
        const modal = document.getElementById('cartModal');
        modal.style.display = 'block';
        this.updateCartModal();
    }

    hideCartModal() {
        const modal = document.getElementById('cartModal');
        modal.style.display = 'none';
    }

    updateCartModal() {
        const cartItems = document.getElementById('cartItems');
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.description}</p>
                        <div style="margin-top: 10px;">
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span style="margin: 0 10px; font-weight: 600;">Qty: ${item.quantity}</span>
                            <button class="quantity-btn" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            <button class="remove-btn" onclick="cart.removeFromCart('${item.id}')" style="margin-left: 15px; color: #ef4444; background: none; border: none; cursor: pointer;">Remove</button>
                        </div>
                    </div>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                </div>
            `).join('');
        }

        // Update total
        document.getElementById('cartTotal').textContent = this.total.toFixed(2);
    }

    showAddedToCartAnimation() {
        // Simple success animation
        const cartIcon = document.querySelector('.nav-cart');
        cartIcon.style.transform = 'scale(1.2)';
        cartIcon.style.background = 'linear-gradient(45deg, #10b981, #059669)';
        
        setTimeout(() => {
            cartIcon.style.transform = 'scale(1)';
            cartIcon.style.background = 'linear-gradient(45deg, #6b46c1, #9333ea)';
        }, 300);

        // Show toast notification
        this.showToast('Item added to cart!');
    }

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(45deg, #10b981, #059669);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 3000;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        // Simple checkout simulation
        const orderSummary = this.items.map(item => 
            `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
        ).join('\n');

        const message = `Order Summary:\n\n${orderSummary}\n\nTotal: $${this.total.toFixed(2)}\n\nProceed to payment?`;
        
        if (confirm(message)) {
            // Simulate order processing
            this.showToast('Order placed successfully! 🎉');
            this.items = [];
            this.updateCartDisplay();
            this.hideCartModal();
            
            // Redirect to thank you page or payment processor
            setTimeout(() => {
                alert('Thank you for your order! You will receive a confirmation email shortly.');
            }, 1000);
        }
    }
}

// Consultation Form Handler
class ConsultationForm {
    constructor() {
        this.form = document.getElementById('consultationForm');
        this.init();
    }

    init() {
        if (this.form) {
            console.log('Consultation form found, adding event listener');
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        } else {
            console.error('Consultation form not found!');
        }
    }

    handleSubmit(e) {
        console.log('Form submitted!');
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const consultationData = {
            name: formData.get('name'),
            email: formData.get('email'),
            birthDate: formData.get('birthDate'),
            birthTime: formData.get('birthTime'),
            birthPlace: formData.get('birthPlace'),
            consultationType: formData.get('consultationType'),
            questions: formData.get('questions')
        };

        console.log('Consultation data:', consultationData);

        // Validate required fields
        if (!consultationData.name || !consultationData.email || !consultationData.birthDate || 
            !consultationData.birthPlace || !consultationData.consultationType || !consultationData.questions) {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate booking process
        this.showBookingConfirmation(consultationData);
    }

    showBookingConfirmation(data) {
        const consultationTypes = {
            'general': 'General Feng Shui Reading - $2.99',
            'love': 'Love & Relationships - $4.99',
            'career': 'Career & Wealth - $4.99',
            'health': 'Health & Wellness - $4.99',
            'comprehensive': 'Comprehensive Analysis - $7.99'
        };

        const message = `
AI Consultation Confirmation:

Name: ${data.name}
Email: ${data.email}
Service: ${consultationTypes[data.consultationType]}
Birth Date: ${data.birthDate}
Birth Place: ${data.birthPlace}

Generate your immediate AI consultation now?
        `;

        if (confirm(message)) {
            console.log('User confirmed consultation generation');
            // Generate and show consultation results immediately
            if (window.cart) {
                window.cart.showToast('Generating your consultation... 🔮');
            }
            this.form.reset();
            
            setTimeout(() => {
                console.log('Showing consultation results');
                this.showConsultationResults(data);
            }, 2000); // Show loading for 2 seconds
        }
    }

    async generateConsultationContent(data) {
        // If OpenAI API key is not available, fall back to template system
        const OPENAI_API_KEY = this.getOpenAIKey();
        
        if (!OPENAI_API_KEY) {
            console.log('OpenAI API key not found, using fallback template system');
            return this.generateFallbackContent(data);
        }

        try {
            const consultation = await this.generateOpenAIConsultation(data, OPENAI_API_KEY);
            return consultation;
        } catch (error) {
            console.error('OpenAI API error:', error);
            console.log('Falling back to template system');
            return this.generateFallbackContent(data);
        }
    }

    getOpenAIKey() {
        // In production, this should be stored securely on your backend
        // For demo purposes, you can set it temporarily in localStorage
        return localStorage.getItem('openai_api_key') || window.OPENAI_API_KEY;
    }

    async generateOpenAIConsultation(data, apiKey) {
        const consultationFocus = {
            'general': 'general feng shui and life guidance',
            'love': 'love, relationships, and romantic energy',
            'career': 'career success, wealth, and professional development',
            'health': 'health, wellness, and energy balance',
            'comprehensive': 'comprehensive life analysis covering all aspects'
        };

        const systemPrompt = `You are a renowned feng shui master and spiritual advisor with 30+ years of experience. You combine ancient Chinese wisdom with modern insights to provide personalized guidance. Your readings are warm, insightful, and practical.

Always structure your response as valid HTML with:
- Start with an h3 title with appropriate emoji
- Use h4 for main sections with emojis  
- Include specific, actionable advice
- Reference the user's birth details meaningfully
- Recommend specific crystals from: Amethyst Bracelet, Rose Quartz Pendant, Citrine Wealth Stone, Black Tourmaline Shield
- Keep tone mystical yet professional
- Always include practical feng shui tips`;

        const userPrompt = `Please provide a detailed ${consultationFocus[data.consultationType]} consultation for:

Name: ${data.name}
Birth Date: ${data.birthDate}
Birth Time: ${data.birthTime || 'Not specified'}
Birth Place: ${data.birthPlace}
Specific Questions/Concerns: ${data.questions}

Focus on ${consultationFocus[data.consultationType]}. Include:
1. Personal energy analysis based on their birth details
2. Specific feng shui recommendations for their situation
3. Crystal recommendations from our collection
4. Actionable steps they can take immediately
5. Address their specific questions directly

Make this reading unique and personalized to their exact situation and concerns.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const result = await response.json();
        const content = result.choices[0].message.content;

        return {
            title: this.getConsultationTitle(data.consultationType),
            content: content
        };
    }

    getConsultationTitle(type) {
        const titles = {
            'general': 'AI-Powered Feng Shui Reading',
            'love': 'AI Love & Relationships Analysis',
            'career': 'AI Career & Wealth Consultation',
            'health': 'AI Health & Wellness Reading',
            'comprehensive': 'AI Comprehensive Life Analysis'
        };
        return titles[type] || titles['general'];
    }

    generateFallbackContent(data) {
        // Keep the original template system as fallback
        const birthDate = new Date(data.birthDate);
        const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                           'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
        const directions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
        const colors = ['Deep Purple', 'Golden Yellow', 'Emerald Green', 'Ruby Red', 'Sapphire Blue'];
        
        const monthIndex = birthDate.getMonth();
        const dayOfYear = Math.floor((birthDate - new Date(birthDate.getFullYear(), 0, 0)) / 86400000);
        
        const primaryElement = elements[dayOfYear % 5];
        const luckyDirection = directions[monthIndex % 8];
        const luckyColor = colors[dayOfYear % 5];
        const zodiacSign = zodiacSigns[monthIndex];

        return {
            title: 'Feng Shui Reading',
            content: `
                <h3>🔮 Your Personal Energy Analysis</h3>
                <p>Dear ${data.name}, based on your birth information, your primary element is <strong>${primaryElement}</strong>.</p>
                
                <h4>✨ Key Insights:</h4>
                <ul>
                    <li><strong>Dominant Element:</strong> ${primaryElement}</li>
                    <li><strong>Lucky Direction:</strong> ${luckyDirection}</li>
                    <li><strong>Power Color:</strong> ${luckyColor}</li>
                    <li><strong>Zodiac Influence:</strong> ${zodiacSign}</li>
                </ul>

                <h4>📝 Your Questions:</h4>
                <p><em>"${data.questions}"</em></p>
                <p>Based on your ${primaryElement} element and ${zodiacSign} influence, focus on incorporating ${luckyColor.toLowerCase()} colors and facing ${luckyDirection.toLowerCase()} directions in your practices.</p>

                <h4>💎 Recommended Crystals:</h4>
                <p>Consider our ${primaryElement === 'Fire' ? 'Citrine Wealth Stone' : primaryElement === 'Water' ? 'Amethyst Bracelet' : primaryElement === 'Earth' ? 'Rose Quartz Pendant' : 'Black Tourmaline Shield'} for your ${primaryElement} element.</p>
            `
        };
    }

    async showConsultationResults(data) {
        console.log('Generating consultation results for:', data);
        
        // Show loading message
        const loadingModal = this.createLoadingModal();
        document.body.appendChild(loadingModal);
        
        try {
            const consultation = await this.generateConsultationContent(data);
            console.log('Generated consultation:', consultation);
            
            // Remove loading modal
            document.body.removeChild(loadingModal);
            
            // Show results
            this.displayConsultationModal(consultation, data);
            
        } catch (error) {
            console.error('Error generating consultation:', error);
            // Remove loading modal
            if (document.body.contains(loadingModal)) {
                document.body.removeChild(loadingModal);
            }
            // Show error message
            alert('Sorry, there was an error generating your consultation. Please try again.');
        }
    }

    createLoadingModal() {
        const loadingModal = document.createElement('div');
        loadingModal.className = 'modal';
        loadingModal.style.display = 'block';
        loadingModal.innerHTML = `
            <div class="modal-content" style="max-width: 500px; text-align: center;">
                <div class="modal-body" style="padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔮</div>
                    <h3>Generating Your AI Consultation...</h3>
                    <p>Our AI feng shui master is analyzing your birth details and creating a personalized reading just for you.</p>
                    <div style="margin: 20px 0;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #6b46c1; border-radius: 50%; border-top: 3px solid transparent; animation: spin 1s linear infinite;"></div>
                    </div>
                    <p style="color: #718096; font-size: 0.9rem;">This may take 10-30 seconds...</p>
                </div>
            </div>
        `;
        return loadingModal;
    }

    displayConsultationModal(consultation, data) {
        // Create results modal
        const resultsModal = document.createElement('div');
        resultsModal.className = 'modal';
        resultsModal.style.display = 'block';
        resultsModal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>🔮 ${consultation.title}</h3>
                    <span class="close consultation-close">&times;</span>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    ${consultation.content}
                    
                    <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 10px;">
                        <h4>🎯 Next Steps:</h4>
                        <p>Implement these feng shui recommendations to enhance your life's energy flow. Browse our crystal collection to find the perfect stones for your journey.</p>
                        <div style="margin-top: 15px;">
                            <button class="btn btn-primary" onclick="document.querySelector('#products').scrollIntoView({behavior: 'smooth'}); document.querySelector('.consultation-close').click();">
                                Shop Recommended Crystals
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(resultsModal);

        // Add close functionality
        const closeBtn = resultsModal.querySelector('.consultation-close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(resultsModal);
        });

        // Close when clicking outside
        resultsModal.addEventListener('click', (e) => {
            if (e.target === resultsModal) {
                document.body.removeChild(resultsModal);
            }
        });

        if (window.cart) {
            window.cart.showToast('Your AI consultation is ready! 🔮');
        }
        console.log('Consultation modal displayed successfully');
    }
}

// Smooth Scrolling for Navigation Links
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Mobile Navigation
class MobileNav {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.init();
    }

    init() {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.toggleMenu();
            });

            // Close menu when clicking on nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMenu();
                });
            });
        }
    }

    toggleMenu() {
        this.navMenu.classList.toggle('active');
        this.hamburger.classList.toggle('active');
    }

    closeMenu() {
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
    }
}

// Hero Section Animations
class HeroAnimations {
    constructor() {
        this.init();
    }

    init() {
        // Animate hero buttons
        document.querySelectorAll('.hero-buttons .btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                if (btn.textContent.includes('Shop Crystals')) {
                    document.querySelector('#products').scrollIntoView({
                        behavior: 'smooth'
                    });
                } else if (btn.textContent.includes('Get AI Reading')) {
                    document.querySelector('#consultation').scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Add CSS animations for toast notifications and loading spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .quantity-btn {
        background: #6b46c1;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .quantity-btn:hover {
        background: #553c9a;
        transform: scale(1.1);
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
`;
document.head.appendChild(style);

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize global cart instance
    window.cart = new ShoppingCart();
    
    // Initialize other components
    new ConsultationForm();
    new SmoothScroll();
    new MobileNav();
    new HeroAnimations();
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Add loading animation for product images
    document.querySelectorAll('.crystal-placeholder').forEach((placeholder, index) => {
        setTimeout(() => {
            placeholder.style.animation = 'pulse 2s infinite';
        }, index * 200);
    });
});