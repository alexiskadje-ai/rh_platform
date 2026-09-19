import {
  buildJobPostingJsonLd,
  serializeJsonLd,
  type JobPostingInput,
} from "@/lib/seo/job-posting";

export function JobPostingJsonLd(input: JobPostingInput) {
  const json = serializeJsonLd(buildJobPostingJsonLd(input));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
