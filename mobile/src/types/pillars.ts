export type Pillar = {
  number: number;
  name: string;
  arabicName: string;
  meaning: string;
  icon: string;
  description: string;
  significance: string;
};

export type PillarType = "islam" | "iman";

export type PillarsData = {
  type: PillarType;
  title: string;
  description: string;
  pillars: Pillar[];
};
