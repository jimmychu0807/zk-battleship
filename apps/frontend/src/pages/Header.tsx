import { Flex, Spacer, Heading, Box } from "@chakra-ui/react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <Flex minWidth="max-content" alignItems="center" gap="2">
      <Box p="2">
        <Heading size="md">
          <Link to="/">ZK Battleship</Link>
        </Heading>
      </Box>
      <Spacer />
      <Box p="2">
        <w3m-button size="sm" />
      </Box>
    </Flex>
  );
}

export default Header;
