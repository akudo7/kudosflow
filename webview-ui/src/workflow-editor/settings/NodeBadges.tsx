import React from 'react';

interface Props {
  showA2ABadge?: boolean;
  showMCPBadge?: boolean;
  showToolNodeBadge?: boolean;
  showSystemSkillsBadge?: boolean;
}

export const NodeBadges: React.FC<Props> = ({
  showA2ABadge = false,
  showMCPBadge = false,
  showToolNodeBadge = false,
  showSystemSkillsBadge = false,
}) => {
  if (!showA2ABadge && !showMCPBadge && !showToolNodeBadge && !showSystemSkillsBadge) {
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
        <span style={badgeStyle} title="A2A Server Binding">
          🔗
        </span>
      )}
      {showMCPBadge && (
        <span style={badgeStyle} title="MCP Server Binding">
          🔌
        </span>
      )}
      {showSystemSkillsBadge && (
        <span style={badgeStyle} title="System Skills Enabled">
          🔧
        </span>
      )}
    </span>
  );
};
