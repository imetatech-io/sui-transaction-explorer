'use client';

import React from 'react';
import { ParsedTransaction } from '@/utils/parser';

interface FlowDiagramProps {
  data: ParsedTransaction;
}

export default function FlowDiagram({ data }: FlowDiagramProps) {
  const { sender, senderName, status, riskLevel } = data;
  const isSuccess = status === 'success';
  const flowColor = riskLevel === 'high' ? 'var(--failure)' : (isSuccess ? 'var(--accent)' : 'var(--failure)');

  const displayName = senderName || `${sender.slice(0, 6)}...${sender.slice(-4)}`;

  return (
    <div className="flow-diagram-container" key={data.digest}>
      <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Connection Line */}
        <path
          d="M100 100 H700"
          stroke={flowColor}
          strokeWidth="3"
          strokeDasharray="8 8"
          className="flow-line"
        />

        {/* Nodes */}
        {/* Sender Node */}
        <g className="flow-node">
          <circle cx="100" cy="100" r="40" fill="var(--glass-bg)" stroke={flowColor} strokeWidth="2" />
          {/* User Icon */}
          <g transform="translate(85, 85) scale(1.2)">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="var(--text-secondary)" />
          </g>
          <text
            x="100"
            y="160"
            textAnchor="middle"
            fill={senderName ? 'var(--accent)' : 'var(--foreground)'}
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            {displayName}
          </text>
        </g>

        {/* Action Node */}
        <g className="flow-node">
          <rect
            x="350" y="60" width="100" height="80" rx="12"
            fill={isSuccess ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'}
            stroke={isSuccess ? 'var(--success)' : 'var(--failure)'}
            strokeWidth="2"
          />
          {/* Code/Contract Icon */}
          <g transform="translate(388, 80) scale(1)">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill={isSuccess ? 'var(--success)' : 'var(--failure)'} />
          </g>
          <text x="400" y="125" textAnchor="middle" fill="var(--text-secondary)" style={{ fontSize: '10px' }}>Smart Contract</text>
        </g>

        {/* Result Node */}
        <g className="flow-node">
          <circle cx="700" cy="100" r="40" fill="var(--glass-bg)" stroke={flowColor} strokeWidth="2" />
          {/* Check/Result Icon */}
          <g transform="translate(688, 88) scale(1)">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="var(--text-secondary)" />
          </g>
          <text x="700" y="160" textAnchor="middle" fill="var(--foreground)" style={{ fontSize: '12px', fontWeight: 600 }}>
            {data.objects.mutated.length + data.objects.created.length} Changes
          </text>
        </g>

        {/* Animated flow particle */}
        <circle r="6" fill={flowColor} className="flow-particle" style={{ opacity: 0 }}>
          <animateMotion
            path="M100 100 H700"
            dur="2s"
            repeatCount="1"
            fill="freeze"
            begin="0.5s"
          />
          <animate attributeName="opacity" from="0" to="1" dur="0.1s" begin="0.5s" fill="freeze" />
          <animate attributeName="opacity" from="1" to="0" dur="0.5s" begin="2.5s" fill="freeze" />
        </circle>
      </svg>

      <style jsx>{`
        .flow-diagram-container {
          padding: 2rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 1rem;
          margin-top: 1rem;
          overflow: hidden;
        }
        .flow-line {
          animation: flowDash 30s linear infinite;
        }
        @keyframes flowDash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .flow-node {
          filter: drop-shadow(0 0 10px rgba(0, 204, 255, 0.2));
        }
        .flow-particle {
          filter: blur(2px) drop-shadow(0 0 8px currentColor);
        }
      `}</style>
    </div>
  );
}
