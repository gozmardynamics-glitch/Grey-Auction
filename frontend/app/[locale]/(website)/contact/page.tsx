import { Facebook, Youtube, Linkedin } from 'lucide-react';

import { Card, CardContent } from '@/shared/components/common/card';
import ContactForm from '../_islands/contact_form';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-2xl sm:text-4xl font-bold text-foreground">
            Contact Us
          </h1>
          <p className="text-muted-foreground">
            Our support experts will help you through the Experience
            {' '}from start to finish.
          </p>
        </div>

        {/* Contact Form */}
        <ContactForm />

        {/* Contact Info + Map */}
        <Card className="bg-card shadow-none border-none">
          <CardContent className="flex flex-col sm:flex-row gap-6 sm:gap-8 p-4 sm:p-8">
            {/* Map */}
            <div className="h-[200px] w-full sm:w-[280px] shrink-0 overflow-hidden rounded-lg bg-muted">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7286!2d3.4226!3d6.4281!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjUnNDEuMiJOIDPCsDI1JzIxLjQiRQ!5e0!3m2!1sen!2sng!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              />
            </div>

            {/* Details */}
            <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium text-foreground">
                  No 5, Ijele Street, Victoria Island,
                  <br />
                  Lagos State
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  Info@grayauctions.com
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Contact Number
                </p>
                <p className="text-sm font-medium text-foreground">
                  +2347081436524
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Follow Us</p>
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
