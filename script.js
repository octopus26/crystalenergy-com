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
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    handleSubmit(e) {
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

Your consultation will be processed within 24 hours and sent to your email.

Proceed with booking?
        `;

        if (confirm(message)) {
            // Simulate successful booking
            cart.showToast('Consultation booked successfully! 🔮');
            this.form.reset();
            
            setTimeout(() => {
                alert('Thank you! Your AI consultation request has been received. You will receive your personalized reading within 24 hours.');
            }, 1000);
        }
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