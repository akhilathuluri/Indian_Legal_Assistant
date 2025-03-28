import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography
} from 'react-simple-maps';
import indiaTopoJson from '../data/india-topo.json';

interface IndiaMapProps {
  onStateClick: (stateName: string) => void;
}

export default function IndiaMap({ onStateClick }: IndiaMapProps) {
  const handleStateClick = (geo: any) => {
    const stateName = geo.properties.name || geo.properties.ST_NM || geo.properties.NAME_1;
    if (stateName) {
      // Map state names to match the database names exactly
      const nameMap: { [key: string]: string } = {
        'Andaman & Nicobar Island': 'Andaman & Nicobar Islands',
        'NCT of Delhi': 'Delhi',
        'Jammu & Kashmir': 'Jammu and Kashmir',
        'Madhya Pradesh': 'Madhya Pradesh',
        'Andhra Pradesh': 'Andhra Pradesh',
        // Add mappings for all states that need exact matching
      };
      
      const mappedName = nameMap[stateName] || stateName;
      console.log('Mapping state name:', stateName, 'to:', mappedName); // For debugging
      onStateClick(mappedName);
    }
  };

  return (
    <div className="w-full h-[600px]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [78.9629, 22.5937] // Centered on India
        }}
      >
        <Geographies geography={indiaTopoJson}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onClick={() => handleStateClick(geo)}
                style={{
                  default: {
                    fill: "#e5e7eb",
                    stroke: "#374151",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  hover: {
                    fill: "#ddd6fe",
                    stroke: "#374151",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                  pressed: {
                    fill: "#c7d2fe",
                    stroke: "#374151",
                    strokeWidth: 0.5,
                    outline: "none",
                  },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
