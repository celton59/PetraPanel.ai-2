import { Card } from "@/components/ui/card";

export const VideoFlowDiagram = () => {
  return (
    <Card className="p-6 w-full overflow-x-auto">
      <svg width="1000" height="600" viewBox="0 0 1000 600">
        {/* Definición de marcadores de flecha */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        {/* Título */}
        <text x="500" y="30" textAnchor="middle" className="text-lg font-bold">
          Flujo de Videos y Roles
        </text>

        {/* Estados Principales */}
        <g transform="translate(50,100)">
          {/* Pending */}
          <circle cx="100" cy="100" r="40" fill="#fef3c7" stroke="#d97706" strokeWidth="2"/>
          <text x="100" y="100" textAnchor="middle" fill="#92400e">Pending</text>

          {/* In Progress */}
          <circle cx="250" cy="100" r="40" fill="#dbeafe" stroke="#2563eb" strokeWidth="2"/>
          <text x="250" y="100" textAnchor="middle" fill="#1d4ed8">In Progress</text>

          {/* Optimize Review */}
          <circle cx="400" cy="100" r="40" fill="#fae8ff" stroke="#c026d3" strokeWidth="2"/>
          <text x="400" y="100" textAnchor="middle" fill="#a21caf">
            <tspan x="400" y="95">Optimize</tspan>
            <tspan x="400" y="115">Review</tspan>
          </text>

          {/* Title Corrections */}
          <circle cx="250" cy="200" r="40" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
          <text x="250" y="200" textAnchor="middle" fill="#b91c1c">
            <tspan x="250" y="195">Title</tspan>
            <tspan x="250" y="215">Corrections</tspan>
          </text>

          {/* Upload Review */}
          <circle cx="550" cy="100" r="40" fill="#f3e8ff" stroke="#a855f7" strokeWidth="2"/>
          <text x="550" y="100" textAnchor="middle" fill="#9333ea">
            <tspan x="550" y="95">Upload</tspan>
            <tspan x="550" y="115">Review</tspan>
          </text>

          {/* Media Corrections */}
          <circle cx="550" cy="200" r="40" fill="#fee2e2" stroke="#dc2626" strokeWidth="2"/>
          <text x="550" y="200" textAnchor="middle" fill="#b91c1c">
            <tspan x="550" y="195">Media</tspan>
            <tspan x="550" y="215">Corrections</tspan>
          </text>

          {/* YouTube Ready */}
          <circle cx="700" cy="100" r="40" fill="#dcfce7" stroke="#16a34a" strokeWidth="2"/>
          <text x="700" y="100" textAnchor="middle" fill="#15803d">
            <tspan x="700" y="95">YouTube</tspan>
            <tspan x="700" y="115">Ready</tspan>
          </text>

          {/* Completed */}
          <circle cx="850" cy="100" r="40" fill="#d1fae5" stroke="#059669" strokeWidth="2"/>
          <text x="850" y="100" textAnchor="middle" fill="#047857">Completed</text>

          {/* Flechas de transición */}
          {/* Optimizer Path */}
          <path d="M140,100 H210" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M290,100 H360" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M250,160 V160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M290,200 C350,200 350,130 360,100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>

          {/* Reviewer Path */}
          <path d="M440,100 H510" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M590,100 H660" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M550,140 V160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
          <path d="M590,200 C650,200 650,130 660,100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>

          {/* Final Path */}
          <path d="M740,100 H810" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" fill="none"/>
        </g>

        {/* Roles y Permisos */}
        <g transform="translate(50,350)">
          {/* Optimizer */}
          <rect x="50" y="0" width="200" height="80" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" rx="4"/>
          <text x="150" y="30" textAnchor="middle" fill="#475569" fontWeight="bold">Optimizer</text>
          <text x="150" y="50" textAnchor="middle" fill="#64748b" fontSize="12">
            Pending → In Progress → Optimize Review
          </text>

          {/* Reviewer */}
          <rect x="300" y="0" width="200" height="80" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" rx="4"/>
          <text x="400" y="30" textAnchor="middle" fill="#475569" fontWeight="bold">Reviewer</text>
          <text x="400" y="50" textAnchor="middle" fill="#64748b" fontSize="12">
            Optimize Review → Upload Review
          </text>

          {/* Uploader */}
          <rect x="550" y="0" width="200" height="80" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" rx="4"/>
          <text x="650" y="30" textAnchor="middle" fill="#475569" fontWeight="bold">Uploader</text>
          <text x="650" y="50" textAnchor="middle" fill="#64748b" fontSize="12">
            Upload Review → YouTube Ready
          </text>
        </g>

        {/* Sub-estados */}
        <g transform="translate(50,450)">
          <rect x="50" y="0" width="700" height="160" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" rx="4"/>
          <text x="400" y="30" textAnchor="middle" fill="#475569" fontWeight="bold">Sub-estados (Metadata)</text>

          {/* Youtuber States */}
          <text x="150" y="60" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
            Youtuber:
          </text>
          <text x="150" y="80" textAnchor="middle" fill="#64748b" fontSize="12">
            Video Disponible • Asignado • Completado
          </text>

          {/* Optimizer States */}
          <text x="400" y="60" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
            Optimizer:
          </text>
          <text x="400" y="80" textAnchor="middle" fill="#64748b" fontSize="12">
            Pendiente Revisión • En Revisión • Completado
          </text>

          {/* Reviewer States */}
          <text x="650" y="60" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold">
            Reviewer:
          </text>
          <text x="650" y="80" textAnchor="middle" fill="#64748b" fontSize="12">
            Revisión Título • Revisión Contenido
          </text>

          {/* Metadata Info */}
          <text x="400" y="120" textAnchor="middle" fill="#64748b" fontSize="12">
            La metadata incluye información adicional como:
          </text>
          <text x="400" y="140" textAnchor="middle" fill="#64748b" fontSize="12">
            Asignaciones • Timestamps • Comentarios • Historial de Revisiones
          </text>
        </g>
      </svg>
    </Card>
  );
};