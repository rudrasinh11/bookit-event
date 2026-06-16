const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * 📨 SEND PREMIUM HTML ACCESS OTP CODE (PHASE 11) - SERVERLESS OPTIMIZED
 */
const sendOTPEmail = async (userEmail, otp, type) => {
    // Re-verify that environment variables are populated inside the serverless execution container
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Missing EMAIL_USER or EMAIL_PASS variables in Vercel dashboard configuration settings.");
    }

    // Instantiates a clean, localized transport stream to bypass serverless cold-start bottlenecks
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        const isVerification = type === 'account_verification';
        const title = isVerification ? 'Verify your BookIT Account' : 'BookIT Booking Verification';
        const msg = isVerification
            ? 'Please use the following single-use code to verify and instantiate your new BookIT system account parameters.'
            : 'Please use the following single-use code to verify and commit your live event seating booking transaction.';

        const mailOptions = {
            from: `"BookIT Security" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `[Security Verification] Action Token Code: ${otp}`,
            html: `
                <div style="max-width: 500px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
                    <div style="padding: 32px; text-align: center;">
                        <h2 style="color: #18181b; margin: 0 0 12px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.4px;">${title}</h2>
                        <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 0 0 28px 0; font-weight: 400;">${msg}</p>
                        
                        <div style="margin: 0 auto 28px auto; padding: 18px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 32px; font-weight: 800; background-color: #f4f4f5; color: #18181b; width: max-content; letter-spacing: 8px; border-radius: 16px; border: 1px solid #e4e4e7; padding-left: 26px;">
                            ${otp}
                        </div>
                        
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0; font-style: normal; font-weight: 500;">This transaction token window systematically expires within 5 minutes. If you did not initialize this command, please ignore this log node safely.</p>
                    </div>
                    <div style="background-color: #f4f4f5; padding: 16px; text-align: center; border-top: 1px solid #e4e4e7; font-size: 11px; color: #a1a1aa; font-family: monospace;">
                        BookIT Security Core Engine v1.0.0
                    </div>
                </div>
            `
        };

        // Forces Vercel to explicitly await authentication verification before delivery execution
        await transporter.verify();
        const responseReceipt = await transporter.sendMail(mailOptions);
        console.log(`OTP successfully delivered to ${userEmail}`);
        return responseReceipt;
    } catch (err) {
        console.error('Nodemailer pipeline transmission error:', err.message);
        throw err; // Bubbles up to ensure authController catches it and prints the message to the screen
    }
};

/**
 * 📨 SEND ENHANCED CONFIRMATION EMAIL WITH PASSENGER MANIFESTS & QR (PHASE 11)
 */
const sendBookingEmail = async (userEmail, userName, eventTitle, bookingData = {}) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        const seatNumbers = bookingData.seatNumbers || [];
        const attendees = bookingData.attendees || [];
        const amount = bookingData.amount || 0;
        const transactionId = bookingData.transactionId || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const seatsString = seatNumbers.length > 0 ? seatNumbers.join(', ') : 'Assigned Seat Matrix';
        const qrChartUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TXN-${transactionId}-SEATS-${seatsString}`;

        const passengerListHtml = attendees.length > 0 
            ? attendees.map((a, i) => `
                <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 12px; font-size: 13px; color: #18181b; font-weight: 600;">Pass Allocation ${i + 1}</td>
                    <td style="padding: 12px; font-size: 13px; color: #27272a;">${a.name || userName}</td>
                    <td style="padding: 12px; font-size: 13px; text-align: right;">
                        <span style="color: #10b981; font-family: monospace; font-weight: bold; background-color: #f0fdf4; padding: 4px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">Seat ${a.seatNumber || seatNumbers[i] || 'N/A'}</span>
                    </td>
                </tr>`).join('')
            : seatNumbers.map((seat, i) => `
                <tr style="border-bottom: 1px solid #e4e4e7;">
                    <td style="padding: 12px; font-size: 13px; color: #18181b; font-weight: 600;">Pass Allocation ${i + 1}</td>
                    <td style="padding: 12px; font-size: 13px; color: #27272a;">${userName}</td>
                    <td style="padding: 12px; font-size: 13px; text-align: right;">
                        <span style="color: #10b981; font-family: monospace; font-weight: bold; background-color: #f0fdf4; padding: 4px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">Seat ${seat}</span>
                    </td>
                </tr>`).join('');

        const mailOptions = {
            from: `"BookIT Core" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🎟️ Booking Confirmed: ${eventTitle} [Seats: ${seatsString}]`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
                    <div style="background-color: #18181b; padding: 32px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Reservation Receipt</h1>
                        <p style="color: #a1a1aa; margin: 6px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Transaction Cleared & Mapped</p>
                    </div>
                    <div style="padding: 32px; background-color: #ffffff;">
                        <h2 style="color: #18181b; margin-top: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;">Greetings ${userName},</h2>
                        <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your multi-seat pass reservation allocation request has completed successfully through our institutional transaction loops.</p>
                        <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; padding: 20px; border-radius: 16px; margin-bottom: 28px;">
                            <h3 style="margin: 0 0 12px 0; color: #18181b; font-size: 15px; font-weight: 700;">${eventTitle}</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tr>
                                    <td style="padding: 4px 0; color: #71717a;">Allocated Spaces:</td>
                                    <td style="padding: 4px 0; color: #18181b; font-weight: 700; text-align: right; font-family: monospace;">${seatsString}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #71717a;">Settle Remittance Gross:</td>
                                    <td style="padding: 4px 0; color: #18181b; font-weight: 700; text-align: right;">₹${amount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #71717a;">Ledger Tracking ID:</td>
                                    <td style="padding: 4px 0; color: #71717a; text-align: right; font-family: monospace; font-size: 12px;">${transactionId}</td>
                                </tr>
                            </table>
                        </div>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                            <thead>
                                <tr style="background-color: #f4f4f5; text-align: left; border-bottom: 1px solid #e4e4e7;">
                                    <th style="padding: 10px 12px; font-size: 11px; color: #71717a; font-weight: 700; text-transform: uppercase;">Tier</th>
                                    <th style="padding: 10px 12px; font-size: 11px; color: #71717a; font-weight: 700; text-transform: uppercase;">Holder Name</th>
                                    <th style="padding: 10px 12px; font-size: 11px; color: #71717a; font-weight: 700; text-transform: uppercase; text-align: right;">Matrix Cell</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${passengerListHtml}
                            </tbody>
                        </table>
                        <div style="text-align: center; background-color: #18181b; padding: 32px; border-radius: 20px;">
                            <img src="${qrChartUrl}" alt="Check QR Link" style="border: 8px solid #ffffff; border-radius: 12px; background-color: #ffffff;" />
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.verify();
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error sending booking confirmation email:', err);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail };