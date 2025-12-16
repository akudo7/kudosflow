import React from 'react';

interface Props {
  showA2ABadge?: boolean;
  showMCPBadge?: boolean;
  showToolNodeBadge?: boolean;
}

export const NodeBadges: React.FC<Props> = ({
  showA2ABadge = false,
  showMCPBadge = false,
  showToolNodeBadge = false,
}) => {
  if (!showA2ABadge && !showMCPBadge && !showToolNodeBadge) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginLeft: '6px',
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '1',
  };

  return (
    <span style={containerStyle}>
      {showToolNodeBadge && (
        <span style={badgeStyle} title="ToolNode">
          🛠️
        </span>
      )}
      {showA2ABadge && (
        <span style={badgeStyle} title="A2A Client Binding">
          🔗
        </span>
      )}
      {showMCPBadge && (
        <span style={badgeStyle} title="MCP Server Binding">
          🔌
        </span>
      )}
    </span>
  );
};
