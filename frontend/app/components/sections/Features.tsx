import React from "react";
import Card from "../ui/Card";

const features = [
  {
    title: "Server Components",
    description:
      "Build faster, more efficient applications with React Server Components that reduce client-side JavaScript.",
  },
  {
    title: "App Router",
    description:
      "Create complex, nested layouts with ease using the new App Router architecture in Next.js.",
  },
  {
    title: "Streaming",
    description:
      "Progressively render UI from the server, improving both actual and perceived loading performance.",
  },
  {
    title: "Turbopack",
    description:
      "Experience lightning-fast development with Rust-based bundling technology that's up to 700x faster.",
  },
];

export default function Features() {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Modern Web Development</h2>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Next.js 15 provides a comprehensive solution for building fast,
          scalable, and user-friendly web applications.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="h-full">
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-foreground/80">{feature.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
