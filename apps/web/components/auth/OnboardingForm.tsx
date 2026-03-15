"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Briefcase, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Loader2,
  X,
  Phone,
  Mail,
  Calendar,
  ShieldCheck
} from "lucide-react";
import { API_BASE_URL, getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface OnboardingFormProps {
  onComplete: () => void;
}

const CANADA_CITIES = [
  "Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton", "Kitchener", "London", "Victoria", "Halifax", "Oshawa", "Windsor"
];

export default function OnboardingForm({ onComplete }: OnboardingFormProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    licenseNumber: "",
    phoneNumber: "",
    address: "",
    professionalEmail: "",
    yearsInBusiness: 0,
    calendlyLink: "",
    markets: [] as string[],
    signatureImageUrl: "",
    brandLogoUrl: "",
    brokerageLogoUrl: "",
    brokerageName: "",
    subscriptionPlan: "free",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadField, setCurrentUploadField] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMarketToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      markets: prev.markets.includes(city)
        ? prev.markets.filter(c => c !== city)
        : [...prev.markets, city]
    }));
  };

  const triggerUpload = (field: string) => {
    setCurrentUploadField(field);
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadField) return;

    setUploadingField(currentUploadField);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      
      setFormData(prev => ({ ...prev, [currentUploadField]: data.url }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingField(null);
      setCurrentUploadField(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Submission failed");
      
      console.log("User Onboarding Completed:", formData);
      onComplete();
    } catch (err) {
      console.error("Onboarding submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">First Name</label>
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Last Name</label>
        <div className="relative">
          <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Business Name</label>
        <div className="relative">
          <Briefcase className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="Realty Pros" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">License #</label>
        <div className="relative">
          <ShieldCheck className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} placeholder="RE-123456" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Phone</label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+1 555..." className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Email</label>
        <div className="relative">
          <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="professionalEmail" value={formData.professionalEmail} onChange={handleInputChange} placeholder="john@..." className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1 col-span-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Address</label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="address" value={formData.address} onChange={handleInputChange} placeholder="123 St, City, Prov" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Years</label>
        <div className="relative">
          <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="yearsInBusiness" type="number" value={formData.yearsInBusiness} onChange={handleInputChange} className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Calendly</label>
        <div className="relative">
          <ArrowRight className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="calendlyLink" value={formData.calendlyLink} onChange={handleInputChange} placeholder="calendly..." className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
      <p className="text-[11px] text-muted-foreground font-medium">Select your active markets:</p>
      <div className="flex flex-wrap gap-1.5">
        {CANADA_CITIES.map(city => (
          <button
            key={city}
            onClick={() => handleMarketToggle(city)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border",
              formData.markets.includes(city)
                ? "bg-foreground text-background border-foreground shadow-sm shadow-foreground/20"
                : "bg-background/40 text-muted-foreground border-border/40 hover:border-foreground/40 hover:text-foreground"
            )}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-0.5">Brokerage Name</label>
        <div className="relative">
          <Briefcase className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/70" />
          <Input name="brokerageName" value={formData.brokerageName} onChange={handleInputChange} placeholder="Century 21" className="h-9 pl-8 bg-background/50 text-sm focus-visible:ring-1" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { id: "signatureImageUrl", label: "Signature", icon: <CheckCircle2 className="h-4 w-4" /> },
          { id: "brandLogoUrl", label: "Brand Logo", icon: <Camera className="h-4 w-4" /> },
          { id: "brokerageLogoUrl", label: "Broker Logo", icon: <Briefcase className="h-4 w-4" /> },
        ].map(field => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-[10px] font-semibold text-muted-foreground text-center block w-full">{field.label}</label>
            <div 
              onClick={() => triggerUpload(field.id)}
              className={cn(
                "relative group h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
                formData[field.id as keyof typeof formData] 
                  ? "border-foreground/30 bg-foreground/5" 
                  : "border-border/40 bg-background/40 hover:border-foreground/40 hover:bg-accent/30"
              )}
            >
              {uploadingField === field.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-foreground" />
              ) : formData[field.id as keyof typeof formData] ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-1.5">
                  <img src={formData[field.id as keyof typeof formData] as string} alt={field.label} className="max-h-16 object-contain rounded-md" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-accent/40 group-hover:bg-primary/10 transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300 max-h-[320px] overflow-y-auto pr-1.5 custom-scrollbar">
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-accent/20 p-3 rounded-lg border border-border/30 space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground/80">
            <User className="h-3.5 w-3.5" /> Details
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><p className="text-muted-foreground scale-90 origin-left">Name</p><p className="font-semibold truncate">{formData.firstName} {formData.lastName}</p></div>
            <div><p className="text-muted-foreground scale-90 origin-left">License</p><p className="font-semibold truncate">{formData.licenseNumber}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground scale-90 origin-left">Business</p><p className="font-semibold truncate">{formData.businessName}</p></div>
          </div>
        </div>

        <div className="bg-accent/20 p-3 rounded-lg border border-border/30 space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground/80">
            <MapPin className="h-3.5 w-3.5" /> Markets
          </h3>
          <div className="flex flex-wrap gap-1">
            {formData.markets.length > 0 ? formData.markets.map(m => (
              <span key={m} className="px-1.5 py-0.5 rounded bg-background/50 border border-border/30 text-[10px] font-medium">{m}</span>
            )) : <p className="text-[10px] text-muted-foreground italic">None</p>}
          </div>
        </div>

        <div className="bg-accent/20 p-3 rounded-lg border border-border/30 space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground/80">
            <Camera className="h-3.5 w-3.5" /> Branding
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[formData.signatureImageUrl, formData.brandLogoUrl, formData.brokerageLogoUrl].map((img, i) => (
              <div key={i} className="h-12 bg-background/50 rounded-md border border-border/30 flex items-center justify-center p-1">
                {img ? <img src={img} className="max-h-10 object-contain rounded" /> : <X className="h-3 w-3 text-muted-foreground/30" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold tracking-tight text-foreground/90">
            STEP {step} OF 4
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 w-8 rounded-full transition-all duration-300",
                  s <= step ? "bg-foreground" : "bg-accent/40"
                )} 
              />
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[220px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => step > 1 && setStep(step - 1)}
          className={cn("text-xs gap-1.5 h-10 px-4 font-medium opacity-60 hover:opacity-100 transition-opacity", step === 1 && "invisible")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <div className="flex gap-3">
          {step < 4 ? (
            <Button 
              size="sm"
              onClick={() => setStep(step + 1)}
              className="text-xs h-10 px-6 font-bold bg-foreground text-background hover:bg-foreground/90 border-none shadow-lg transition-all active:scale-[0.98] rounded-xl"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="text-xs h-10 px-8 font-bold bg-foreground text-background hover:bg-foreground/90 border-none shadow-lg transition-all active:scale-[0.98] rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Complete Setup <CheckCircle2 className="ml-2 h-4 w-4" /></>}
            </Button>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--foreground), 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--foreground), 0.2); }
      `}} />
    </div>
  );
}
