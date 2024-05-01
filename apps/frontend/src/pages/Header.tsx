import { Flex, Spacer, Heading, Box } from "@chakra-ui/react";

function Header() {
  return (
    <Flex minWidth="max-content" alignItems="center" gap="2">
      <Box p="2">
        <Heading size="md">ZK Battleship</Heading>
      </Box>
      <Spacer />
      <Box p="2">
        <w3m-button size="sm" />
      </Box>
    </Flex>
  );
}

export default Header;
