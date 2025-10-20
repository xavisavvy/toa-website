import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  const lastUpdated = "October 20, 2025";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4" data-testid="text-privacy-title">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to Tales of Aneria. We respect your privacy and are committed to protecting your personal information. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                </p>
                <p>
                  Please read this privacy policy carefully. By using our website, you agree to the collection and use of information 
                  in accordance with this policy. If you do not agree with the terms of this privacy policy, please do not access the site.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
                  <p className="mb-2">When you visit our website, we automatically collect certain information about your device, including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>IP address</li>
                    <li>Browser type and version</li>
                    <li>Device type and operating system</li>
                    <li>Pages visited and time spent on pages</li>
                    <li>Referring website addresses</li>
                    <li>Browsing actions and patterns</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Information You Provide</h3>
                  <p className="mb-2">We may collect information that you voluntarily provide to us, such as:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Email address (if you contact us or subscribe to updates)</li>
                    <li>Name and contact details (if you submit forms or inquiries)</li>
                    <li>Any other information you choose to provide</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide, operate, and maintain our website</li>
                  <li>Improve, personalize, and expand our website</li>
                  <li>Understand and analyze how you use our website</li>
                  <li>Develop new features, products, and services</li>
                  <li>Communicate with you for customer service and support</li>
                  <li>Send you updates about our content and community</li>
                  <li>Monitor and analyze usage and trends to improve user experience</li>
                  <li>Detect, prevent, and address technical issues</li>
                </ul>
              </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We use the following third-party services that may collect information about you:</p>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">YouTube</h3>
                  <p>
                    We integrate YouTube videos and playlist content on our website. When you interact with YouTube content, 
                    YouTube may collect information according to their privacy policy.
                  </p>
                  <p className="text-sm mt-1">
                    YouTube Privacy Policy: <a 
                      href="https://policies.google.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      https://policies.google.com/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Podcast Hosting Services</h3>
                  <p>
                    We display podcast episodes through RSS feeds from podcast hosting platforms. These services may collect 
                    usage data when you play or download episodes.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Etsy</h3>
                  <p>
                    We display products from our Etsy shop. When you click on product links, you'll be directed to Etsy, 
                    which has its own privacy policy.
                  </p>
                  <p className="text-sm mt-1">
                    Etsy Privacy Policy: <a 
                      href="https://www.etsy.com/legal/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      https://www.etsy.com/legal/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Patreon</h3>
                  <p>
                    We link to our Patreon page for community support. Patreon has its own privacy policy governing any 
                    interactions on their platform.
                  </p>
                  <p className="text-sm mt-1">
                    Patreon Privacy Policy: <a 
                      href="https://www.patreon.com/policy/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      https://www.patreon.com/policy/privacy
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Social Media Platforms</h3>
                  <p>
                    We link to our social media profiles on platforms like YouTube, Twitter/X, Instagram, and TikTok. 
                    Each platform has its own privacy policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cookies and Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may use cookies and similar tracking technologies to track activity on our website and hold certain information. 
                  Cookies are files with small amounts of data which may include an anonymous unique identifier.
                </p>
                <p>
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
                  if you do not accept cookies, you may not be able to use some portions of our website.
                </p>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We use commercially reasonable security measures to protect your personal information from unauthorized access, 
                  use, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, 
                  and we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We retain your personal information only for as long as necessary to fulfill the purposes outlined in this 
                  Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>
              </CardContent>
            </Card>

            {/* Your Privacy Rights */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Your Privacy Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-foreground">Access:</strong> Request access to your personal information</li>
                  <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong className="text-foreground">Opt-out:</strong> Opt-out of marketing communications</li>
                  <li><strong className="text-foreground">Data Portability:</strong> Request a copy of your data in a portable format</li>
                </ul>
                <p className="mt-4">
                  To exercise any of these rights, please contact us using the information provided below.
                </p>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Our website is not intended for children under the age of 13. We do not knowingly collect personal information 
                  from children under 13. If you become aware that a child has provided us with personal information, please contact us, 
                  and we will take steps to delete such information.
                </p>
              </CardContent>
            </Card>

            {/* International Data Transfers */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Your information may be transferred to and maintained on computers located outside of your state, province, 
                  country, or other governmental jurisdiction where data protection laws may differ. By using our website, 
                  you consent to such transfers.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Privacy Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new 
                  Privacy Policy on this page and updating the "Last Updated" date at the top of this policy.
                </p>
                <p>
                  You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy 
                  are effective when they are posted on this page.
                </p>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions about this Privacy Policy, please contact us:
                </p>
                <div className="space-y-1">
                  <p><strong className="text-foreground">Email:</strong> privacy@talesofaneria.com</p>
                  <p><strong className="text-foreground">Website:</strong> www.talesofaneria.com</p>
                </div>
              </CardContent>
            </Card>

            {/* GDPR and CCPA Compliance */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">GDPR and CCPA Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For European Union Users (GDPR)</h3>
                  <p>
                    If you are in the European Economic Area (EEA), you have certain data protection rights under the 
                    General Data Protection Regulation (GDPR). We aim to take reasonable steps to allow you to correct, 
                    amend, delete, or limit the use of your personal information.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For California Residents (CCPA)</h3>
                  <p>
                    If you are a California resident, you have specific rights regarding your personal information under 
                    the California Consumer Privacy Act (CCPA), including the right to know what personal information is 
                    collected, the right to delete personal information, and the right to opt-out of the sale of personal 
                    information (we do not sell personal information).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
