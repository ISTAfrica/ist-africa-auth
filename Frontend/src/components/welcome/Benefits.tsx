import { CheckCircle } from 'lucide-react';

const benefits = [
  'Single sign-on across all applications',
  'Advanced session management',
  'Real-time security monitoring',
  'Multi-factor authentication support',
  'Comprehensive audit logs',
  'API-first architecture',
];

export const Benefits = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
                Why Choose IAA?
              </h2>
              <p className="text-muted-foreground mb-8">
                Built for African organizations, IAA provides enterprise-level
                authentication with the simplicity you need and the security you demand.
              </p>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">Uptime</span>
                  <span className="text-green-600 font-bold">99.9%</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">Response Time</span>
                  <span className="text-primary font-bold">&lt;100ms</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">Active Users</span>
                  <span className="text-amber-600 font-bold">10,000+</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground font-medium">Integrations</span>
                  <span className="text-foreground font-bold">50+</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};