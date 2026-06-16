const mongoose = require('mongoose');

const seatCategorySchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true }
}, { _id: true });

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true }, 
    time: { type: String, default: "18:00" }, 
    location: { type: String, required: true }, 
    locationLink: { type: String, default: "" }, 
    coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    category: { type: String, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    image: { type: String }, 
    ticketPrice: { type: Number, required: true, default: 0 }, 
    
    seatCategories: [seatCategorySchema], 
    status: { type: String, enum: ['Active', 'Completed', 'Cancelled'], default: 'Active' },
    
    // Phase 4 Event Enhancement Extensions
    tags: [{ type: String }],
    imageGallery: [{ type: String }],
    popularityScore: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    seatMapLayout: [{
        seatId: { type: String, required: true }, 
        rowLabel: { type: String, default: "A" },  
        rowNumber: { type: Number, default: 1 },    
        colNumber: { type: Number, default: 1 },    
        category: { type: String, required: true },
        
        // Phase 5 Advanced Booking Status: Explicitly including 'Locked' flag state
        status: { 
            type: String, 
            enum: ['Available', 'Booked', 'Reserved', 'Disabled', 'Locked'], 
            default: 'Available' 
        },
        
        // Phase 5 Temporary reservation timer hooks
        lockedAt: { type: Date, default: null },
        lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

        bookingDetails: {
            bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
            userName: { type: String, default: "" },
            userEmail: { type: String, default: "" },
            paidAmount: { type: Number, default: 0 },
            paymentStatus: { type: String, default: "" },
            bookingDate: { type: Date, default: null }
        }
    }],
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Upgraded production compounds index configurations
eventSchema.index({ title: 'text', description: 'text', category: 1 });
eventSchema.index({ date: 1, status: 1, popularityScore: -1 });

module.exports = mongoose.model('Event', eventSchema);