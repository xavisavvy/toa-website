import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function TermsOfService() {
  const lastUpdated = "October 21, 2025";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service - Tales of Aneria"
        description="Read the Terms of Service for Tales of Aneria. Learn about intellectual property rights, user conduct, disclaimers, and legal agreements governing website use."
        canonical="https://talesofaneria.com/legal/tos"
        noindex={true}
      />
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4" data-testid="text-tos-title">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Agreement to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to Tales of Aneria. These Terms of Service ("Terms") govern your access to and use of our website, 
                  content, and services. By accessing or using our website, you agree to be bound by these Terms.
                </p>
                <p>
                  If you do not agree with any part of these Terms, you may not access our website or use our services. 
                  We reserve the right to modify these Terms at any time, and your continued use of the website constitutes 
                  acceptance of any changes.
                </p>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Intellectual Property Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Content Ownership</h3>
                  <p>
                    All content on this website, including but not limited to text, graphics, logos, images, audio clips, 
                    video clips, character descriptions, stories, and other materials ("Content"), is the property of Tales of Aneria 
                    or its content creators and is protected by United States and international copyright, trademark, and other 
                    intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Dungeons & Dragons Content</h3>
                  <p>
                    Dungeons & Dragons, D&D, D&D Beyond, and related trademarks and content are owned by Wizards of the Coast LLC. 
                    Our use of D&D content and character information from D&D Beyond is in accordance with the Fan Content Policy 
                    and applicable terms of service. We are not affiliated with, endorsed by, or sponsored by Wizards of the Coast.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Original Characters and Stories</h3>
                  <p>
                    Original characters, storylines, and world-building elements created by our cast are the intellectual property 
                    of Tales of Aneria and the individual creators. While we utilize the D&D game system, our original narrative 
                    content is protected by copyright.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Third-Party Content</h3>
                  <p className="mb-2">
                    Our website may display content from third-party services including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>YouTube videos and thumbnails</li>
                    <li>D&D Beyond character data and avatars</li>
                    <li>Spotify and YouTube Music playlists</li>
                    <li>Etsy product listings</li>
                    <li>Podcast episode artwork and audio</li>
                  </ul>
                  <p className="mt-2">
                    All third-party content remains the property of its respective owners and is subject to their terms of service.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Conduct */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">User Conduct and Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>When using our website, you agree NOT to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Copy, reproduce, distribute, or create derivative works from our content without permission</li>
                  <li>Use our content for commercial purposes without authorization</li>
                  <li>Remove or alter any copyright, trademark, or other proprietary notices</li>
                  <li>Use automated systems (bots, scrapers) to access the website without permission</li>
                  <li>Attempt to interfere with or disrupt the website's functionality or security</li>
                  <li>Engage in any unlawful, harmful, or fraudulent activity</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Upload or transmit viruses, malware, or other harmful code</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </CardContent>
            </Card>

            {/* Fan Content Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Fan Content and Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Fan Art and Fan Fiction</h3>
                  <p>
                    We love seeing fan creations inspired by our content! You are welcome to create and share fan art, 
                    fan fiction, and other transformative works based on Tales of Aneria, subject to the following conditions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Fan works must be non-commercial (you cannot sell fan art without permission)</li>
                    <li>Provide proper attribution to Tales of Aneria</li>
                    <li>Do not imply official endorsement or affiliation</li>
                    <li>Respect the characters and tone of our content</li>
                    <li>Follow community standards and applicable content policies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Commercial Use</h3>
                  <p>
                    If you wish to create commercial products based on Tales of Aneria content (merchandise, publications, etc.), 
                    you must obtain written permission from us first. Please contact us to discuss licensing opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content and Services */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Content and Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Availability</h3>
                  <p>
                    We strive to keep our website available at all times, but we do not guarantee uninterrupted access. 
                    We may suspend, modify, or discontinue any part of our website or services at any time without notice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Content Accuracy</h3>
                  <p>
                    While we make efforts to ensure accuracy, we do not warrant that content on our website is complete, 
                    current, or error-free. Episode information, character data, and other details may change without notice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Third-Party Links</h3>
                  <p>
                    Our website contains links to third-party websites and services (YouTube, Patreon, Etsy, social media platforms, etc.). 
                    We are not responsible for the content, privacy policies, or practices of these third-party sites. 
                    Your use of third-party services is at your own risk and subject to their terms.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Community and Patreon */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Community Support and Patreon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We offer community support through Patreon and other platforms. If you choose to support us financially:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Payments and subscriptions are processed through third-party platforms (Patreon, etc.)</li>
                  <li>Benefits and rewards are subject to change based on our content schedule and availability</li>
                  <li>We reserve the right to modify, suspend, or cancel support tiers at any time</li>
                  <li>Refund policies are governed by the payment platform's terms (Patreon, etc.)</li>
                  <li>Supporters must follow our community guidelines and code of conduct</li>
                </ul>
                <p className="mt-4">
                  We are grateful for all support but cannot guarantee specific outcomes, content schedules, or personalized services.
                </p>
              </CardContent>
            </Card>

            {/* Merchandise and Shop */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Merchandise and Purchases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We sell merchandise through our Etsy shop and other third-party platforms. When you make a purchase:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Transactions are processed through the third-party platform (Etsy, etc.)</li>
                  <li>Returns, refunds, and customer service are subject to the platform's policies</li>
                  <li>Product availability, pricing, and descriptions may change without notice</li>
                  <li>Shipping times and costs are estimates and may vary</li>
                  <li>We are not responsible for issues arising from third-party payment processing or shipping</li>
                </ul>
              </CardContent>
            </Card>

            {/* Disclaimers */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Disclaimers and Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">No Warranties</h3>
                  <p>
                    OUR WEBSITE AND CONTENT ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                    WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                    AND NON-INFRINGEMENT.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Content Disclaimer</h3>
                  <p>
                    Our content is intended for entertainment purposes only. Tales of Aneria is a fictional narrative. 
                    Any resemblance to actual persons, events, or places is coincidental. Content may include fantasy violence, 
                    mature themes, and adult language appropriate for the D&D game system.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Limitation of Liability</h3>
                  <p>
                    TO THE FULLEST EXTENT PERMITTED BY LAW, TALES OF ANERIA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                    SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY 
                    OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                    <li>Your use or inability to use our website</li>
                    <li>Any unauthorized access to or use of our servers or data</li>
                    <li>Any bugs, viruses, or harmful code transmitted through our website</li>
                    <li>Any errors or omissions in content</li>
                    <li>Third-party conduct or content</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Indemnification */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Indemnification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You agree to indemnify, defend, and hold harmless Tales of Aneria, its creators, cast members, and affiliates 
                  from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your violation of these Terms of Service</li>
                  <li>Your violation of any rights of another party</li>
                  <li>Your use of our website or content</li>
                  <li>Any content you submit or contribute</li>
                </ul>
              </CardContent>
            </Card>

            {/* Dispute Resolution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Dispute Resolution and Governing Law</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Informal Resolution</h3>
                  <p>
                    If you have any dispute with us, you agree to first contact us and attempt to resolve the dispute informally. 
                    We will work in good faith to resolve any concerns.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Governing Law</h3>
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of the United States, 
                    without regard to its conflict of law provisions. Any legal action arising out of these Terms shall be 
                    filed exclusively in the courts located in the applicable jurisdiction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Copyright Claims */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Copyright and DMCA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We respect the intellectual property rights of others. If you believe that your copyrighted work has been 
                  used on our website in a way that constitutes copyright infringement, please provide us with the following 
                  information in accordance with the Digital Millennium Copyright Act (DMCA):
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>A description of the copyrighted work you claim has been infringed</li>
                  <li>The location of the allegedly infringing material on our website</li>
                  <li>Your contact information (email address, phone number)</li>
                  <li>A statement that you have a good faith belief that the use is not authorized</li>
                  <li>A statement that the information in your notice is accurate</li>
                  <li>Your physical or electronic signature</li>
                </ul>
                <p className="mt-4">
                  Please send DMCA notices to: legal@talesofaneria.com
                </p>
              </CardContent>
            </Card>

            {/* Modifications */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to modify these Terms of Service at any time. When we make changes, we will update 
                  the "Last Updated" date at the top of this page. Significant changes will be communicated through our 
                  website or social media channels.
                </p>
                <p>
                  Your continued use of our website after changes are posted constitutes your acceptance of the modified Terms. 
                  If you do not agree with the changes, you must stop using our website.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to terminate or suspend your access to our website at any time, without notice, 
                  for conduct that we believe violates these Terms, is harmful to other users, or is otherwise unlawful or inappropriate.
                </p>
                <p>
                  Upon termination, your right to use our website will immediately cease. All provisions of these Terms 
                  that by their nature should survive termination shall survive, including but not limited to ownership provisions, 
                  warranty disclaimers, and limitations of liability.
                </p>
              </CardContent>
            </Card>

            {/* Severability */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Severability and Waiver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited 
                  or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
                </p>
                <p>
                  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-1">
                  <p><strong className="text-foreground">Email:</strong> legal@talesofaneria.com</p>
                  <p><strong className="text-foreground">Website:</strong> www.talesofaneria.com</p>
                </div>
                <p className="mt-4">
                  For general inquiries, community questions, or support, you can also reach us through our social media 
                  channels or community platforms.
                </p>
              </CardContent>
            </Card>

            {/* Acknowledgment */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">Acknowledgment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM. 
                  IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT USE OUR WEBSITE OR SERVICES.
                </p>
                <p className="font-semibold text-foreground mt-4">
                  Thank you for being part of the Tales of Aneria community! We appreciate your support and hope you enjoy our content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
