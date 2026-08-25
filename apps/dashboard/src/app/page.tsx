import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShieldCheck, ShoppingCart } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">SaaSPlatform</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24 md:py-32 lg:py-40 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Build Your Next-Gen Store in Minutes
          </h1>
          <p className="mt-6 max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            The ultimate platform to launch, manage, and scale your e-commerce business. Experience lightning-fast search, robust security, and seamless checkouts.
          </p>
          <div className="mt-8 flex gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base">Get Started</Button>
            </Link>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base">View Demo</Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 bg-muted/50 rounded-3xl mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to succeed</h2>
            <p className="mt-4 text-muted-foreground text-lg">Powerful features to help you grow your business faster than ever.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-none shadow-sm bg-background">
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Lightning Fast Search (Typesense)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Powered by Typesense, deliver instant, typo-tolerant search results to your customers, boosting conversion rates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-background">
              <CardHeader>
                <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Tenant Isolation & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Enterprise-grade security with strict tenant isolation, ensuring your store data is always protected and private.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-background">
              <CardHeader>
                <ShoppingCart className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Seamless Checkout</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Optimized checkout flows designed to reduce cart abandonment and provide a frictionless payment experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="container mx-auto px-4 py-20 mb-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground text-lg">Choose the plan that fits your growing business.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">Basic</CardTitle>
                <CardDescription className="mt-2">For individuals and small stores</CardDescription>
                <div className="mt-4 text-4xl font-bold">$29<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Up to 1,000 products</li>
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Basic search</li>
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Standard support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button className="w-full" variant="outline">Start Free Trial</Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-primary shadow-md">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-primary">Pro</CardTitle>
                <CardDescription className="mt-2">For growing businesses</CardDescription>
                <div className="mt-4 text-4xl font-bold">$99<span className="text-xl text-muted-foreground font-normal">/mo</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Unlimited products</li>
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Lightning fast search (Typesense)</li>
                  <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-primary" /> Priority 24/7 support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/signup" className="w-full">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SaaSPlatform Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
