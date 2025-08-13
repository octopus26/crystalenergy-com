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
            !consultationData.birthPlace || !consultationData.consultationType) {
            alert('Please fill in all required fields.');
            return;
        }

        // Simulate booking process
        this.showBookingConfirmation(consultationData);
    }

    showBookingConfirmation(data) {
        const consultationTypes = {
            'general': 'General Feng Shui Reading - $29',
            'love': 'Love & Relationships - $39',
            'career': 'Career & Wealth - $39',
            'health': 'Health & Wellness - $39',
            'comprehensive': 'Comprehensive Analysis - $59'
        };

        const message = `
Consultation Booking Confirmation:

Name: ${data.name}
Email: ${data.email}
Service: ${consultationTypes[data.consultationType]}
Birth Date: ${data.birthDate}
Birth Place: ${data.birthPlace}

Generate your AI consultation now?
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

    generateConsultationContent(data) {
        const birthDate = new Date(data.birthDate);
        const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                           'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const elements = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
        const directions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
        const colors = ['Deep Purple', 'Golden Yellow', 'Emerald Green', 'Ruby Red', 'Sapphire Blue'];
        
        // Simple algorithm to generate personalized content
        const monthIndex = birthDate.getMonth();
        const dayOfYear = Math.floor((birthDate - new Date(birthDate.getFullYear(), 0, 0)) / 86400000);
        
        const primaryElement = elements[dayOfYear % 5];
        const luckyDirection = directions[monthIndex % 8];
        const luckyColor = colors[dayOfYear % 5];
        const zodiacSign = zodiacSigns[monthIndex];

        const consultationTemplates = {
            'general': {
                title: 'General Feng Shui Reading',
                content: `
                    <h3>🔮 Your Personal Energy Analysis</h3>
                    <p>Dear ${data.name}, based on your birth information, your primary element is <strong>${primaryElement}</strong>, which influences your life's energy flow.</p>
                    
                    <h4>✨ Key Insights:</h4>
                    <ul>
                        <li><strong>Dominant Element:</strong> ${primaryElement} - This element shapes your natural tendencies and attracts certain energies.</li>
                        <li><strong>Lucky Direction:</strong> ${luckyDirection} - Face this direction during meditation and important decisions.</li>
                        <li><strong>Power Color:</strong> ${luckyColor} - Incorporate this color into your wardrobe and living space.</li>
                        <li><strong>Zodiac Influence:</strong> ${zodiacSign} - Your sign brings unique qualities to your feng shui profile.</li>
                    </ul>

                    <h4>🏠 Home Recommendations:</h4>
                    <p>Place ${primaryElement.toLowerCase()} elements in your living space. If your element is Wood, add plants; Fire, use candles; Earth, incorporate crystals; Metal, add metallic decor; Water, include a small fountain.</p>

                    <h4>💎 Recommended Crystals:</h4>
                    <p>Based on your ${primaryElement} element, consider our ${primaryElement === 'Fire' ? 'Citrine' : primaryElement === 'Water' ? 'Amethyst' : primaryElement === 'Earth' ? 'Rose Quartz' : 'Black Tourmaline'} collection.</p>
                `
            },
            'love': {
                title: 'Love & Relationships Reading',
                content: `
                    <h3>💖 Your Love Energy Profile</h3>
                    <p>Hello ${data.name}, your ${primaryElement} element creates a unique love vibration that attracts meaningful relationships.</p>
                    
                    <h4>💕 Relationship Insights:</h4>
                    <ul>
                        <li><strong>Love Element:</strong> ${primaryElement} energy influences how you give and receive love.</li>
                        <li><strong>Romantic Direction:</strong> ${luckyDirection} - Enhance your bedroom's ${luckyDirection.toLowerCase()} corner.</li>
                        <li><strong>Attraction Color:</strong> ${luckyColor} - Wear this color on dates and romantic occasions.</li>
                        <li><strong>Compatible Signs:</strong> Your ${zodiacSign} energy harmonizes well with certain zodiac signs.</li>
                    </ul>

                    <h4>🌹 Love Enhancement Tips:</h4>
                    <p>Place pairs of objects in your bedroom's ${luckyDirection.toLowerCase()} corner. Rose Quartz crystals will amplify your natural ${primaryElement.toLowerCase()} love energy.</p>

                    <h4>💎 Love Crystal Recommendation:</h4>
                    <p>Our Rose Quartz Pendant is perfect for your ${primaryElement} element, helping attract and maintain loving relationships.</p>
                `
            },
            'career': {
                title: 'Career & Wealth Reading',
                content: `
                    <h3>💰 Your Wealth & Success Blueprint</h3>
                    <p>Greetings ${data.name}, your ${primaryElement} element holds the key to unlocking abundant career opportunities.</p>
                    
                    <h4>🎯 Career Insights:</h4>
                    <ul>
                        <li><strong>Success Element:</strong> ${primaryElement} energy drives your professional ambitions.</li>
                        <li><strong>Wealth Direction:</strong> ${luckyDirection} - Position your desk facing this direction.</li>
                        <li><strong>Prosperity Color:</strong> ${luckyColor} - Incorporate into your work attire and office space.</li>
                        <li><strong>Career Strengths:</strong> ${zodiacSign} traits enhance your professional capabilities.</li>
                    </ul>

                    <h4>🏢 Office Feng Shui:</h4>
                    <p>Activate your office's ${luckyDirection.toLowerCase()} corner with ${primaryElement.toLowerCase()} elements. Keep your workspace clutter-free to allow wealth energy to flow.</p>

                    <h4>💎 Wealth Crystal Recommendation:</h4>
                    <p>Our Citrine Wealth Stone aligns perfectly with your ${primaryElement} element, attracting prosperity and career advancement.</p>
                `
            },
            'health': {
                title: 'Health & Wellness Reading',
                content: `
                    <h3>🌿 Your Wellness Energy Map</h3>
                    <p>Dear ${data.name}, your ${primaryElement} element influences your physical and emotional well-being.</p>
                    
                    <h4>⚖️ Health Insights:</h4>
                    <ul>
                        <li><strong>Healing Element:</strong> ${primaryElement} governs your body's natural healing processes.</li>
                        <li><strong>Wellness Direction:</strong> ${luckyDirection} - Face this direction during meditation and exercise.</li>
                        <li><strong>Healing Color:</strong> ${luckyColor} - Use in your bedroom and wellness spaces.</li>
                        <li><strong>Constitutional Type:</strong> ${zodiacSign} influences your health patterns and needs.</li>
                    </ul>

                    <h4>🧘 Wellness Practices:</h4>
                    <p>Balance your ${primaryElement.toLowerCase()} energy through specific activities. Spend time in nature, practice mindfulness facing ${luckyDirection.toLowerCase()}, and wear ${luckyColor.toLowerCase()} during healing sessions.</p>

                    <h4>💎 Healing Crystal Recommendation:</h4>
                    <p>Amethyst crystals resonate with your ${primaryElement} element, promoting spiritual healing and emotional balance.</p>
                `
            },
            'comprehensive': {
                title: 'Comprehensive Life Analysis',
                content: `
                    <h3>🌟 Your Complete Feng Shui Life Map</h3>
                    <p>Welcome ${data.name}, here's your comprehensive feng shui analysis based on your unique energy signature.</p>
                    
                    <h4>🔮 Core Energy Profile:</h4>
                    <ul>
                        <li><strong>Primary Element:</strong> ${primaryElement} - Your fundamental life force</li>
                        <li><strong>Power Direction:</strong> ${luckyDirection} - Your direction of strength and opportunity</li>
                        <li><strong>Signature Color:</strong> ${luckyColor} - Your personal energy amplifier</li>
                        <li><strong>Zodiac Essence:</strong> ${zodiacSign} - Your celestial influence</li>
                    </ul>

                    <h4>🏠 Complete Home Harmony:</h4>
                    <p>Transform your living space by activating the ${luckyDirection.toLowerCase()} areas with ${primaryElement.toLowerCase()} elements. Use ${luckyColor.toLowerCase()} accents throughout your home.</p>

                    <h4>💼 Career & Wealth:</h4>
                    <p>Position important work activities facing ${luckyDirection.toLowerCase()}. Your ${primaryElement} element attracts opportunities in leadership, creativity, and innovation.</p>

                    <h4>💖 Love & Relationships:</h4>
                    <p>Enhance relationship harmony by placing paired objects in your bedroom's ${luckyDirection.toLowerCase()} corner. Your ${zodiacSign} energy creates deep, meaningful connections.</p>

                    <h4>🌿 Health & Wellness:</h4>
                    <p>Support your wellbeing through ${primaryElement.toLowerCase()}-based practices. Regular meditation facing ${luckyDirection.toLowerCase()} will maintain your energy balance.</p>

                    <h4>💎 Complete Crystal Set Recommendation:</h4>
                    <p>For your ${primaryElement} element, we recommend our complete crystal collection: Amethyst for spiritual growth, Rose Quartz for love, Citrine for wealth, and Black Tourmaline for protection.</p>
                `
            }
        };

        return consultationTemplates[data.consultationType] || consultationTemplates['general'];
    }

    showConsultationResults(data) {
        console.log('Generating consultation results for:', data);
        const consultation = this.generateConsultationContent(data);
        console.log('Generated consultation:', consultation);
        
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
            window.cart.showToast('Your consultation is ready! 🔮');
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

// Add CSS animations for toast notifications
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