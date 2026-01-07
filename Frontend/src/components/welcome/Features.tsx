import { Shield, Key, Users, Zap } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption and security protocols to keep your data safe' },
  { icon: Key, title: 'OAuth2 & Token-Based Auth', description: 'Industry-standard authentication with secure token management' },
  { icon: Users, title: 'Centralized User Management', description: 'Manage all users across applications from one dashboard' },
  { icon: Zap, title: 'Seamless Integration', description: 'Easy integration with REST APIs for all your applications' },
];

export const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need for secure, scalable authentication</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};