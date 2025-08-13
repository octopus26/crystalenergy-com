const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const {
  createConsultation,
  updateConsultationResult,
  getConsultationById,
  logEmailEvent
} = require('../utils/database');

const router = express.Router();

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Input validation middleware
const validateConsultationRequest = [
  body('orderId').isUUID().withMessage('Valid order ID is required'),
  body('customerId').isUUID().withMessage('Valid customer ID is required'),
  body('consultationType').isIn(['basic', 'detailed', 'comprehensive']).withMessage('Invalid consultation type'),
  body('birthDate').isISO8601().withMessage('Valid birth date is required'),
  body('birthTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)'),
  body('birthPlace').isLength({ min: 2 }).withMessage('Birth place is required'),
  body('questions').isLength({ min: 10 }).withMessage('Specific questions are required (minimum 10 characters)')
];

// Generate AI consultation using OpenAI
async function generateAIConsultation(consultationData) {
  const { consultationType, birthDate, birthTime, birthPlace, questions } = consultationData;
  
  const consultationPrompts = {
    basic: `You are a professional feng shui consultant. Provide a basic feng shui consultation based on:
Birth Date: ${birthDate}
Birth Time: ${birthTime || 'Not provided'}
Birth Place: ${birthPlace}
Specific Questions: ${questions}

Please provide a comprehensive feng shui reading that includes:
1. Personal feng shui element analysis
2. Lucky colors and directions
3. Recommendations for home/office arrangement
4. Crystal recommendations
5. Specific answers to their questions

Keep the response professional, insightful, and helpful. Limit to 300-400 words.`,

    detailed: `You are an expert feng shui master. Provide a detailed feng shui consultation based on:
Birth Date: ${birthDate}
Birth Time: ${birthTime || 'Not provided'}
Birth Place: ${birthPlace}
Specific Questions: ${questions}

Please provide an in-depth feng shui analysis including:
1. Complete BaZi (Four Pillars) analysis
2. Personal element strength and weaknesses
3. Detailed lucky/unlucky directions and colors
4. Annual feng shui forecast
5. Home/office feng shui recommendations with specific room guidance
6. Crystal and gemstone recommendations with placement
7. Career and relationship feng shui advice
8. Specific remedies for challenges mentioned
9. Detailed answers to all questions

Make it comprehensive and actionable. 600-800 words.`,

    comprehensive: `You are a renowned feng shui grandmaster. Provide a comprehensive feng shui consultation based on:
Birth Date: ${birthDate}
Birth Time: ${birthTime || 'Not provided'}
Birth Place: ${birthPlace}
Specific Questions: ${questions}

Please provide a complete feng shui life analysis including:
1. Full BaZi (Four Pillars) chart analysis with element interactions
2. Complete personal feng shui profile with strengths/weaknesses
3. Detailed lucky/unlucky directions, colors, numbers, and timing
4. Annual and monthly feng shui forecast
5. Complete home feng shui audit with room-by-room guidance
6. Office/workplace feng shui optimization
7. Comprehensive crystal and gemstone recommendations with exact placement
8. Career advancement feng shui strategies
9. Relationship and family harmony feng shui
10. Health and wealth enhancement techniques
11. Specific remedies and solutions for all challenges
12. Detailed answers to all questions with action steps
13. Monthly feng shui calendar for optimal timing

Make this a complete life guide. 1000-1200 words with specific, actionable advice.`
  };

  const prompt = consultationPrompts[consultationType] || consultationPrompts.basic;

  try {
    if (OPENAI_API_KEY) {
      const response = await axios.post(OPENAI_API_URL, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional feng shui consultant with 20+ years of experience. Provide authentic, helpful, and detailed feng shui guidance based on traditional principles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: consultationType === 'comprehensive' ? 1500 : consultationType === 'detailed' ? 1000 : 600,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } else {
      // Fallback consultation templates when OpenAI is not available
      const fallbackTemplates = {
        basic: `## Your Personal Feng Shui Consultation

**Birth Information Analysis:**
Based on your birth date (${birthDate}) and location (${birthPlace}), your primary feng shui element appears to be balanced with strong earth energy.

**Lucky Elements & Colors:**
- Primary Colors: Deep purple, gold, earth tones
- Lucky Directions: Southwest, Northeast
- Best Crystal: Amethyst for wisdom and clarity

**Home Feng Shui Recommendations:**
1. Place a small amethyst cluster in your bedroom's southwest corner
2. Use warm lighting in living areas
3. Keep your workspace organized and clutter-free

**Specific Guidance:**
Regarding your questions about "${questions.substring(0, 50)}...", the feng shui principles suggest focusing on creating harmony in your personal space. Consider placing crystals strategically to enhance positive energy flow.

**Action Steps:**
- Declutter your main living areas
- Add plants to improve air quality and energy
- Use mirrors thoughtfully to expand positive spaces

This reading is based on traditional feng shui principles. For best results, implement changes gradually and observe how they affect your daily energy.`,

        detailed: `## Comprehensive Feng Shui Life Analysis

**Personal Element Profile:**
Born on ${birthDate} in ${birthPlace}, your feng shui chart shows a unique combination of elements that influences your life path.

**BaZi Analysis Overview:**
Your four pillars reveal strong metal energy balanced with water elements, suggesting intelligence and adaptability as your core strengths.

**Lucky Directions & Colors:**
- Primary Lucky Directions: West, Northwest, North
- Power Colors: White, silver, deep blue, black
- Avoid: Excessive red or orange in main living areas
- Best Times: Morning hours (7-11 AM) for important decisions

**Home Feng Shui Master Plan:**

*Living Room:*
- Position main seating facing your lucky direction (West)
- Place a large amethyst geode in the wealth corner (far left from entrance)
- Use soft lighting with warm white bulbs

*Bedroom:*
- Bed headboard against solid wall, facing West if possible
- Rose quartz on nightstand for relationship harmony
- Avoid mirrors facing the bed directly

*Office/Study:*
- Desk positioned to face Northwest
- Clear quartz cluster on desk for mental clarity
- Keep workspace organized with minimal electronics

**Crystal Recommendations:**
1. **Amethyst** - Main entrance for protection and wisdom
2. **Rose Quartz** - Bedroom for love and self-care
3. **Citrine** - Office for abundance and success
4. **Black Tourmaline** - Near electronics for protection

**Career & Relationship Guidance:**
Your element combination suggests success in communication-based careers. For relationships, focus on creating peaceful, harmonious environments.

**Specific Answers to Your Questions:**
"${questions}" - Based on feng shui principles, your concerns can be addressed through environmental adjustments and crystal placement. The key is creating balance between your personal energy and your surroundings.

**Monthly Feng Shui Calendar:**
- Best months for new beginnings: March, June, September
- Focus on home improvements: April, August
- Relationship focus: February, May, November

**Action Plan:**
1. Week 1: Declutter and organize main living areas
2. Week 2: Add recommended crystals to key positions
3. Week 3: Adjust furniture positioning
4. Week 4: Observe and fine-tune energy flow

This detailed analysis provides a foundation for optimizing your personal feng shui. Implement changes gradually and trust your intuition about what feels right in your space.`,

        comprehensive: `## Complete Feng Shui Life Transformation Guide

**Executive Summary:**
Born ${birthDate} in ${birthPlace}, your complete feng shui profile reveals a complex and powerful energy pattern that, when properly harnessed, can lead to significant life improvements across all areas.

**Complete BaZi Four Pillars Analysis:**

*Year Pillar (Ancestral Energy):* Strong earth foundation
*Month Pillar (Career & Social):* Metal element prominence  
*Day Pillar (Self & Marriage):* Water-metal combination
*Hour Pillar (Children & Legacy):* Balanced wood influence

**Element Strength Analysis:**
- **Metal (40%)**: Communication, precision, leadership
- **Water (25%)**: Adaptability, intuition, flow
- **Earth (20%)**: Stability, patience, nurturing
- **Wood (10%)**: Growth, creativity, flexibility
- **Fire (5%)**: Passion, recognition, energy

**Comprehensive Lucky/Unlucky Guide:**

*Lucky Elements:* Metal, Water, Earth
*Lucky Colors:* White, silver, gold, deep blue, navy, brown, beige
*Lucky Numbers:* 1, 4, 6, 7, 8, 9
*Lucky Directions:* West, Northwest, North, Southwest
*Lucky Times:* 7-11 AM, 3-7 PM
*Lucky Seasons:* Autumn, Winter, Late Summer

*Unlucky Elements:* Excessive Fire
*Avoid Colors:* Bright red, orange (small accents OK)
*Avoid Directions:* South (for major decisions)
*Challenging Times:* Noon hours for important meetings

**Annual Feng Shui Forecast:**
- **2024**: Focus on career advancement and skill development
- **2025**: Relationship and partnership opportunities
- **2026**: Financial growth and property acquisition
- **2027**: Travel and expansion phase

**Complete Home Feng Shui Blueprint:**

*Entrance (Ming Tang):*
- Large amethyst cluster on entrance table
- Mirror on side wall (not facing door directly)
- Fresh flowers weekly, white or purple
- Good lighting, minimum 3 light sources

*Living Room (Social Energy Hub):*
- Main sofa facing West with solid wall behind
- Coffee table: round or oval shape preferred
- Large rose quartz in relationship corner (back right)
- Plants: pothos or peace lily in corners
- Avoid: TV directly opposite main seating

*Kitchen (Health & Abundance):*
- Keep stove clean and working perfectly
- Wooden cutting boards and natural materials
- Small citrine near stove for abundance
- Fresh herbs growing on windowsill

*Master Bedroom (Personal Sanctuary):*
- Bed headboard against solid wall, facing West
- Matching nightstands with table lamps
- Rose quartz on your side, clear quartz on partner's side
- Soft, muted colors: cream, soft blue, gentle lavender
- Remove electronics or place black tourmaline nearby

*Home Office (Career Success Zone):*
- Desk in commanding position facing Northwest
- Clear quartz cluster on desk left side
- Green plant on right side of desk
- Inspiration board or vision board on wall behind you
- Organize cables and eliminate clutter weekly

*Bathroom (Energy Drainage Prevention):*
- Keep toilet lid down always
- Place small black tourmaline in corners
- Use essential oils: eucalyptus or lavender
- Mirror must be clean and well-lit

**Advanced Crystal Programming Guide:**

*Primary Protection Grid:*
- 4 black tourmaline pieces in main living area corners
- 1 large amethyst cluster at main entrance
- Programming: "I am protected and surrounded by positive energy"

*Abundance Manifestation Setup:*
- Citrine triangle in office/wealth corner
- Green aventurine with clear quartz amplifiers
- Programming: "Abundance flows to me easily and naturally"

*Relationship Harmony Array:*
- Rose quartz pairs in bedroom and living room
- Moonstone for intuition and emotional balance
- Programming: "Love and harmony fill my relationships"

**Career Feng Shui Mastery:**

*Office Optimization:*
- Desk: solid wood preferred, metal acceptable
- Chair: high back with arm rests, facing your lucky direction
- Lighting: full spectrum light, avoid fluorescent
- Colors: incorporate your lucky colors in accessories
- Success symbols: dragon figurine facing your desk

*Networking Energy:*
- Wear white or silver on important meeting days
- Carry small clear quartz in left pocket
- Schedule important calls during your power hours

**Relationship & Family Harmony:**

*Love Life Enhancement:*
- Pairs of objects throughout home (candles, crystals, art)
- Rose quartz in bedroom south corner
- Remove all single-person artwork from bedroom
- Fresh flowers in living room weekly

*Family Dynamics:*
- Round dining table preferred for unity
- Family photos in earth-toned frames
- Central gathering area kept clutter-free and inviting

**Health & Vitality Optimization:**

*Bedroom Health Setup:*
- Air purifying plants: snake plant, spider plant
- Natural fiber bedding and pillows
- Himalayan salt lamp for air ionization
- Keep bedroom 65-68°F for optimal sleep

*Kitchen Health Zone:*
- Fresh produce visible and accessible
- Water filter for pure drinking water
- Herbs and spices in glass containers
- Natural cleaning products only

**Wealth Building Strategy:**

*Wealth Corner Activation:*
- Far left corner from main entrance
- Purple cloth under wealth display
- Citrine cluster with green aventurine
- Fresh purple flowers or purple amethyst
- Wealth symbols: Chinese coins, jade plant

*Investment Timing:*
- Best months: September, December, March
- Avoid major financial decisions: June, July
- Daily timing: make financial decisions during metal hours (3-7 PM)

**Specific Resolution to Your Questions:**

"${questions}"

Based on your complete feng shui profile, these concerns align with temporary imbalances in your environmental energy. Here's your specific action plan:

1. **Immediate (Next 7 Days):** Focus on decluttering and organizing your primary living space
2. **Short-term (2-4 Weeks):** Implement crystal placements and furniture repositioning
3. **Medium-term (2-3 Months):** Establish new daily routines aligned with your optimal timing
4. **Long-term (6+ Months):** Monitor results and fine-tune your feng shui system

**Monthly Action Calendar:**

*Week 1 of Each Month:* Energy assessment and space clearing
*Week 2:* Crystal cleansing and repositioning if needed
*Week 3:* Focus on wealth and career enhancement activities
*Week 4:* Relationship and family harmony practices

**Success Monitoring System:**

Track these indicators monthly:
- Energy levels and sleep quality
- Career opportunities and recognition
- Relationship harmony and communication
- Financial flow and opportunities
- Overall life satisfaction and joy

**Emergency Feng Shui Solutions:**

For immediate energy shifts:
- Burn white sage or palo santo to clear negative energy
- Ring a singing bowl in each room corner
- Place fresh white flowers in main living area
- Light a white candle with intention for positive change

This comprehensive guide provides you with a complete feng shui transformation system. Implement changes gradually, starting with the most important areas first. Trust your intuition and adjust based on how the changes feel in your daily life.

Remember: Feng shui is a tool for optimization, but your personal energy and intention are the most powerful factors in creating positive change.`
      };

      return fallbackTemplates[consultationType] || fallbackTemplates.basic;
    }
  } catch (error) {
    console.error('Error generating AI consultation:', error);
    
    // Return fallback on error
    return `## Your Feng Shui Consultation

Thank you for your consultation request. Based on your birth information (${birthDate}, ${birthPlace}) and your specific questions, here are your personalized feng shui recommendations:

**Personal Element Analysis:**
Your birth date suggests a strong connection to earth elements, indicating stability and grounding as core strengths.

**Lucky Colors & Directions:**
- Colors: Earth tones, deep purple, gold
- Directions: Southwest and Northeast for best energy
- Crystals: Amethyst for wisdom, Citrine for abundance

**Recommendations:**
1. Place crystals in your home's wealth corner (far left from entrance)
2. Keep your living space organized and clutter-free
3. Use natural materials and warm lighting

**Regarding Your Questions:**
"${questions.substring(0, 100)}..." - Focus on creating harmony in your environment to support your goals.

This consultation is based on traditional feng shui principles. For best results, implement changes gradually and observe their effects on your daily energy.`;
  }
}

// Create consultation
router.post('/generate', validateConsultationRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      orderId,
      customerId,
      consultationType,
      birthDate,
      birthTime,
      birthPlace,
      questions
    } = req.body;

    // Create consultation record
    const consultationId = uuidv4();
    await createConsultation({
      id: consultationId,
      order_id: orderId,
      customer_id: customerId,
      consultation_type: consultationType,
      birth_date: birthDate,
      birth_time: birthTime,
      birth_place: birthPlace,
      questions: questions
    });

    // Generate AI consultation
    const aiResult = await generateAIConsultation({
      consultationType,
      birthDate,
      birthTime,
      birthPlace,
      questions
    });

    // Update consultation with result
    await updateConsultationResult(consultationId, aiResult);

    res.json({
      success: true,
      consultationId: consultationId,
      result: aiResult,
      type: consultationType,
      message: 'Consultation generated successfully'
    });

  } catch (error) {
    console.error('Consultation generation error:', error);
    res.status(500).json({
      error: 'Failed to generate consultation',
      message: error.message
    });
  }
});

// Get consultation by ID
router.get('/:consultationId', async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await getConsultationById(consultationId);
    
    if (!consultation) {
      return res.status(404).json({
        error: 'Consultation not found'
      });
    }

    res.json({
      success: true,
      consultation: {
        id: consultation.id,
        type: consultation.consultation_type,
        result: consultation.ai_result,
        status: consultation.status,
        createdAt: consultation.created_at,
        generatedAt: consultation.generated_at
      }
    });

  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({
      error: 'Failed to retrieve consultation',
      message: error.message
    });
  }
});

// Get consultation types and pricing
router.get('/types/pricing', (req, res) => {
  res.json({
    success: true,
    consultationTypes: [
      {
        id: 'basic',
        name: 'Basic Reading',
        description: 'Essential feng shui guidance and crystal recommendations',
        price: 299, // $2.99 in cents
        duration: '15-20 minutes',
        features: [
          'Personal element analysis',
          'Lucky colors and directions',
          'Basic crystal recommendations',
          'Home arrangement tips'
        ]
      },
      {
        id: 'detailed',
        name: 'Detailed Analysis',
        description: 'Comprehensive feng shui consultation with BaZi analysis',
        price: 599, // $5.99 in cents
        duration: '30-45 minutes',
        features: [
          'Complete BaZi four pillars analysis',
          'Annual feng shui forecast',
          'Detailed home/office guidance',
          'Specific crystal placements',
          'Career and relationship advice'
        ],
        popular: true
      },
      {
        id: 'comprehensive',
        name: 'Master Consultation',
        description: 'Complete life transformation guide with ongoing support',
        price: 799, // $7.99 in cents
        duration: '60+ minutes',
        features: [
          'Full life feng shui blueprint',
          'Room-by-room detailed guidance',
          'Monthly feng shui calendar',
          'Advanced crystal programming',
          'Wealth and health optimization',
          'Emergency feng shui solutions'
        ]
      }
    ]
  });
});

module.exports = router;