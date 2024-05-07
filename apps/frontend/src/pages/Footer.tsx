import { Box, Flex, Text, Tooltip, Link, Icon } from "@chakra-ui/react";
import { FaGithub } from "react-icons/fa6";

import { project } from "../consts";

function Footer() {
  const { authorHomepage, github } = project;

  return (
    <Flex justify="center">
      <Box mr={5}>
        <Link href={github}>
          <Icon color="gray" as={FaGithub} boxSize={5} />
        </Link>
      </Box>
      <Text>
        Made for
        <Tooltip label="self-learning purpose">&nbsp; 🧑🏻‍💻 &nbsp;</Tooltip>
        by&nbsp;
        <Link color="teal.500" href={authorHomepage}>
          Jimmy Chu
        </Link>
      </Text>
    </Flex>
  );
}

export default Footer;
