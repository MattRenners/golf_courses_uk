export interface Club {
  ClubId: number;
  ClubName: string;
  LocAddress1: string | null;
  LocAddress2: string | null;
  LocAddress3: string | null;
  LocAddress4: string | null;
  PostalCode: string | null;
  Latitude: number;
  Longitude: number;
  FacilityDescription: string | null;
  Email: string | null;
  Phone: string | null;
  Website: string | null;
  ThumbnailImageSource: string | null;
}

export interface Facility {
  FacilityTypeId: number;
  TypeName: string;
  Icon: string;
  Quantity: number;
  IsAvailable: boolean;
  FacilityTypeGroupId: number;
}

export interface ClubDetails {
  ClubId: number;
  ClubName: string;
  FacilityTypes: Facility[];
  FacilityDescription: string | null;
  Latitude: number;
  Longitude: number;
}

export interface Course {
  CourseId: number;
  Name: string;
}

export interface Hole {
  HoleNo: number;
  Par: number;
  Distance: number;
  Stroke: number; // Stroke Index
  DistanceYards: number;
  DistanceMetres: number;
}

export interface Marker {
  MarkerId: number;
  DisplayMarkerName: string;
  MarkerColor: string; // e.g., "ff0000"
  UsgaNzcr: number; // Course Rating
  SlopeRating: number;
  TotalPar: number;
  Holes: Hole[];
}
