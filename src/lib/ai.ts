type Insight = {
  title: string;
  tip: string;
};

export async function generateInsightsStub(context: string): Promise<Insight[]> {
  const seed = Math.abs(hashString(context)) % 3;
  const ideas: Insight[] = [
    {
      title: "Consistency Beats Intensity",
      tip: "Do a 20-minute easy run and 5 minutes of mobility today. Small wins compound."
    },
    {
      title: "Fuel the Engine",
      tip: "Target 500 extra calories from whole foods if volume is up; hydrate to clear urine."
    },
    {
      title: "Race Visualization",
      tip: "Close your eyes for 3 minutes and visualize T2 and the final mile."
    }
  ];
  return [ideas[seed]];
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return h;
}

