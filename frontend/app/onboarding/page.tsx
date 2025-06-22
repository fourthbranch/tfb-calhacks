"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { RadioGroup, RadioGroupItem } from "../components/ui/RadioGroup";
import { Textarea } from "../components/ui/Textarea";
import LandingHeader from "../components/ui/LandingHeader";
import LandingFooter from "../components/ui/LandingFooter";
import { api } from "../lib/api";
import { Separator } from "../components/ui/separator";

const topics = [
  "Technology",
  "Politics",
  "Finance",
  "Sports",
  "Entertainment",
  "Local News",
  "World News",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState("");
  const [politicalLeaning, setPoliticalLeaning] = useState("neutral");
  const [articleLength, setArticleLength] = useState("short");
  const [writingTone, setWritingTone] = useState("informal");
  const [contentStyle, setContentStyle] = useState("straight");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [additionalInfoError, setAdditionalInfoError] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("user_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      router.push("/landing");
    }
  }, [router]);

  const handleAddLocation = () => {
    if (currentLocation && !locations.includes(currentLocation)) {
      setLocations([...locations, currentLocation]);
      setCurrentLocation("");
    }
  };

  const handleRemoveLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const validateAdditionalInfo = (text: string) => {
    if (!text.trim()) {
      return "Please tell us more about yourself to personalize your news experience.";
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 10) {
      return `Please provide at least 10 words. You currently have ${wordCount} word${
        wordCount !== 1 ? "s" : ""
      }.`;
    }

    return "";
  };

  const handleAdditionalInfoChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = e.target.value;
    setAdditionalInfo(text);
    setAdditionalInfoError(validateAdditionalInfo(text));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate additional info
    const additionalInfoValidation = validateAdditionalInfo(additionalInfo);
    if (additionalInfoValidation) {
      setAdditionalInfoError(additionalInfoValidation);
      setIsLoading(false);
      return;
    }

    const writingStyle = [articleLength, writingTone, contentStyle];

    try {
      const userCheck = await api.checkUser(email);

      if (userCheck.exists && userCheck.user_id) {
        await api.updateUser(userCheck.user_id, {
          preferred_topics: selectedTopics,
          locations: locations,
          political_leaning: politicalLeaning,
          preferred_writing_style: writingStyle,
          additional_info: additionalInfo,
        });
      } else {
        await api.createUser({
          email: email,
          preferred_topics: selectedTopics,
          locations: locations,
          political_leaning: politicalLeaning,
          preferred_writing_style: writingStyle,
          additional_info: additionalInfo,
        });
      }

      localStorage.setItem("onboarding_completed", "true");
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingHeader />
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Personalize Your News Feed
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              This will help us tailor the news to your exact preferences.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Section 1: Topics */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  1. What topics are you interested in?
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {topics.map((topic) => (
                    <div
                      key={topic}
                      onClick={() => {
                        setSelectedTopics((prev) =>
                          prev.includes(topic)
                            ? prev.filter((t) => t !== topic)
                            : [...prev, topic]
                        );
                      }}
                      className={`py-3 px-2 rounded-lg text-center cursor-pointer transition-all duration-200 border text-sm font-medium
                        ${
                          selectedTopics.includes(topic)
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                        }`}
                    >
                      {topic}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section 2: Locations */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  2. Add relevant locations (optional)
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    id="locations"
                    placeholder="e.g., San Francisco, California"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="flex-grow"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLocation}
                  >
                    Add Location
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-gray-200"
                    >
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(index)}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Section 3: Political Leaning */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  3. What&apos;s your political leaning?
                </h3>
                <RadioGroup
                  value={politicalLeaning}
                  onValueChange={setPoliticalLeaning}
                  className="flex flex-wrap gap-x-6 gap-y-3"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="left" id="left" />
                    <Label htmlFor="left" className="ml-2">
                      Left
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral" className="ml-2">
                      Neutral
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="right" id="right" />
                    <Label htmlFor="right" className="ml-2">
                      Right
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Section 4: Writing Style */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  4. Preferred writing style
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <Label className="font-semibold text-gray-700">
                      Article length:
                    </Label>
                    <RadioGroup
                      value={articleLength}
                      onValueChange={setArticleLength}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="short" id="short-l" />
                        <Label htmlFor="short-l" className="ml-2">
                          short
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="depth" id="depth-l" />
                        <Label htmlFor="depth-l" className="ml-2">
                          depth
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-700">
                      Writing tone:
                    </Label>
                    <RadioGroup
                      value={writingTone}
                      onValueChange={setWritingTone}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="informal" id="informal-l" />
                        <Label htmlFor="informal-l" className="ml-2">
                          informal
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="formal" id="formal-l" />
                        <Label htmlFor="formal-l" className="ml-2">
                          formal
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-700">
                      Content style:
                    </Label>
                    <RadioGroup
                      value={contentStyle}
                      onValueChange={setContentStyle}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem value="satirical" id="satirical-l" />
                        <Label htmlFor="satirical-l" className="ml-2">
                          satirical
                        </Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="straight" id="straight-l" />
                        <Label htmlFor="straight-l" className="ml-2">
                          straight
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section 5: Additional Info - Now Mandatory */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  5. Tell us more about yourself (so news gets more
                  personalized)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Share details about your background, interests, profession, or
                  life circumstances. This helps us provide personalized news
                  insights and impact analysis.
                  <span className="text-red-600 font-medium">
                    {" "}
                    Minimum 10 words required.
                  </span>
                </p>
                <Textarea
                  id="additional-info"
                  placeholder="e.g., I'm a software engineer in San Francisco who's passionate about climate change and follows tech startups. I'm also a parent of two young children and interested in education policy..."
                  value={additionalInfo}
                  onChange={handleAdditionalInfoChange}
                  className={`min-h-[120px] ${
                    additionalInfoError
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }`}
                  required
                />
                {additionalInfoError && (
                  <p className="text-red-600 text-sm mt-2">
                    {additionalInfoError}
                  </p>
                )}
                <div className="text-xs text-gray-500">
                  Word count:{" "}
                  {additionalInfo.trim()
                    ? additionalInfo.trim().split(/\s+/).length
                    : 0}
                  /10 minimum
                </div>
              </div>

              <div className="flex flex-col items-end pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || !!additionalInfoError}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Saving..." : "Finish Onboarding & View News"}
                </Button>
                {error && (
                  <p className="text-red-600 text-right mt-4">{error}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
