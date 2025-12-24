import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  HelpCircle,
  Mail,
  MessageSquare,
  BookOpen,
  Users,
  Shield,
  Send,
  Star,
  Bug,
  Lightbulb
} from "lucide-react";

const Support = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [feedbackForm, setFeedbackForm] = useState({
    type: "suggestion",
    content: "",
    rating: 5
  });

  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for helping us improve SpendWise.",
    });
    setFeedbackForm({ type: "suggestion", content: "", rating: 5 });
  };

  const faqData = [
    {
      question: "How to add/edit/delete expenses?",
      answer: "To add an expense, click the 'Add Expense' button and fill in the details. To edit, click on any expense in your list. To delete, click the trash icon next to the expense."
    },
    {
      question: "How to categorize expenses?",
      answer: "When adding an expense, select from categories like Food, Travel, Bills, Entertainment, etc. You can also create custom categories in Settings."
    },
    {
      question: "How to set spending limits and alerts?",
      answer: "Go to Settings > Expense & Budget Settings to set monthly/weekly limits and configure overspending alerts."
    },
    {
      question: "How to track group expenses?",
      answer: "Use the 'Split' feature when adding expenses. You can split equally or set custom amounts for each person."
    },
    {
      question: "How to enable/disable login/signup?",
      answer: "Authentication settings can be managed in Settings > Security & Privacy section."
    },
    {
      question: "How to switch between light and dark theme?",
      answer: "Go to Settings > Appearance to toggle between light and dark themes."
    }
  ];

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Support Center</h1>
      </div>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions about SpendWise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@spendwise.com</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="mb-2">Coming Soon</Badge>
                <p className="text-sm text-muted-foreground">
                  Real-time chat support will be available soon
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
              <CardDescription>
                Send us a message and we'll get back to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                User Guides & Tutorials
              </CardTitle>
              <CardDescription>
                Step-by-step guides to help you master SpendWise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">Getting Started Guide</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete walkthrough for new users
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground">
                    Short videos showing key features
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">Advanced Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn about reports and analytics
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h3 className="font-semibold">Best Practices</h3>
                  <p className="text-sm text-muted-foreground">
                    Tips for effective expense tracking
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Community & Help Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Discussion Forums</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Connect with other users and share tips
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Knowledge Base</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Comprehensive articles and tutorials
                </p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Feedback & Suggestions
              </CardTitle>
              <CardDescription>
                Help us improve SpendWise with your feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Feedback Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={feedbackForm.type === "suggestion" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeedbackForm({ ...feedbackForm, type: "suggestion" })}
                    >
                      <Lightbulb className="h-4 w-4 mr-1" />
                      Suggestion
                    </Button>

                    <Button
                      type="button"
                      variant={feedbackForm.type === "feature" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFeedbackForm({ ...feedbackForm, type: "feature" })}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Feature Request
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      >
                        <Star
                          className={`h-4 w-4 ${star <= feedbackForm.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-content">What can we improve?</Label>
                  <Textarea
                    id="feedback-content"
                    value={feedbackForm.content}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, content: e.target.value })}
                    rows={4}
                    placeholder="Tell us about your experience..."
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Submit Feedback
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy Information
              </CardTitle>
              <CardDescription>
                Learn how SpendWise protects your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Data Security</h3>
                  <p className="text-sm text-muted-foreground">
                    All your financial data is encrypted using industry-standard AES-256 encryption.
                    We never store your banking credentials or sensitive payment information.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Privacy Policy</h3>
                  <p className="text-sm text-muted-foreground">
                    We collect only the minimum data necessary to provide our services.
                    Your personal information is never shared with third parties without your consent.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Data Usage</h3>
                  <p className="text-sm text-muted-foreground">
                    Your expense data is used solely to provide analytics and insights within the app.
                    We use anonymized usage statistics to improve our services.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Your Rights</h3>
                  <p className="text-sm text-muted-foreground">
                    You have the right to access, modify, or delete your data at any time.
                    Contact us to exercise these rights or for any privacy-related questions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Support;