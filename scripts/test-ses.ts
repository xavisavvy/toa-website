import 'dotenv/config';
import { sendEmail } from '../server/notification-service';

async function testSESEmail() {
  console.info('🧪 Testing AWS SES Email Service...\n');

  // Check if SES is configured
  if (!process.env.AWS_SES_ACCESS_KEY_ID) {
    console.error('❌ AWS SES not configured!');
    console.info('\nPlease set the following environment variables:');
    console.info('  - AWS_SES_REGION');
    console.info('  - AWS_SES_ACCESS_KEY_ID');
    console.info('  - AWS_SES_SECRET_ACCESS_KEY');
    console.info('  - AWS_SES_FROM_EMAIL\n');
    console.info('See docs/integration/AWS_SES_SETUP.md for setup instructions.');
    process.exit(1);
  }

  console.info('Configuration:');
  console.info(`  Region: ${process.env.AWS_SES_REGION}`);
  console.info(`  From Email: ${process.env.AWS_SES_FROM_EMAIL}`);
  console.info(`  Access Key: ${process.env.AWS_SES_ACCESS_KEY_ID?.substring(0, 10)}...`);
  console.info('');

  // Get test recipient email from command line or use default
  const testEmail = process.argv[2] || process.env.SUPPORT_EMAIL || 'test@example.com';
  
  console.info(`📧 Sending test email to: ${testEmail}`);
  console.info('⚠️  Note: If in SES Sandbox mode, this email must be verified!\n');

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: 'Test Email from Tales of Aneria',
      body: `This is a test email sent via AWS SES.

If you're seeing this, the email integration is working correctly!

Configuration Details:
- Region: ${process.env.AWS_SES_REGION}
- From: ${process.env.AWS_SES_FROM_EMAIL}
- Timestamp: ${new Date().toISOString()}

Next Steps:
1. Verify domain for production use
2. Request production access to remove sandbox restrictions
3. Set up bounce/complaint handling
4. Monitor sending statistics

For more information, see: docs/integration/AWS_SES_SETUP.md`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Test Email from Tales of Aneria</h1>
          <p>If you're seeing this, the email integration is working correctly! ✅</p>
          
          <h2 style="color: #666;">Configuration Details</h2>
          <ul>
            <li><strong>Region:</strong> ${process.env.AWS_SES_REGION}</li>
            <li><strong>From:</strong> ${process.env.AWS_SES_FROM_EMAIL}</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>
          
          <h2 style="color: #666;">Next Steps</h2>
          <ol>
            <li>Verify domain for production use</li>
            <li>Request production access to remove sandbox restrictions</li>
            <li>Set up bounce/complaint handling</li>
            <li>Monitor sending statistics</li>
          </ol>
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; color: #999; font-size: 12px;">
            For more information, see: <code>docs/integration/AWS_SES_SETUP.md</code>
          </p>
        </div>
      `,
    });

    console.info('\n✅ Test email sent successfully!');
    console.info(`   Result: ${result ? 'Delivered to SES' : 'Logged (SES not configured)'}`);
    console.info('\nCheck the recipient\'s inbox (and spam folder) for the test email.');
    
  } catch (error) {
    console.error('\n❌ Failed to send test email:');
    
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      
      // Provide helpful troubleshooting tips
      if (error.message.includes('not verified')) {
        console.info('\n💡 Troubleshooting:');
        console.info('   - Verify the FROM email address in AWS SES Console');
        console.info('   - If in Sandbox mode, verify the TO email address as well');
        console.info('   - See: docs/integration/AWS_SES_SETUP.md');
      } else if (error.message.includes('credentials')) {
        console.info('\n💡 Troubleshooting:');
        console.info('   - Check AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY');
        console.info('   - Ensure IAM user has SES permissions');
        console.info('   - Verify credentials are not expired');
      } else if (error.message.includes('region')) {
        console.info('\n💡 Troubleshooting:');
        console.info('   - Check AWS_SES_REGION is set correctly');
        console.info('   - Ensure SES is available in your region');
      }
    } else {
      console.error(error);
    }
    
    process.exit(1);
  }
}

// Run the test
testSESEmail().catch(console.error);
