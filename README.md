# Overview

This project was created to take advantage of AI coding via agents and makes a best possible attempt at using AI to compose code which can be directly pasted into FileMaker Pro.

# Background

FileMaker Pro is a closed code environment. It does not use individual text files to store its code. All logic and schema is stored within its binary files.

FileMaker provides a few input/output methods as XML which provide a clear definition of how a FileMaker database solution is structured.

- The Database Design Report was the first method and is accessed via the Tools menu in FileMaker.
- The newer more modern output method is Save a Copy as XML. Also available in the Tools menu and most importantly a script step available for automated delivery of the XML.
- The third XML format used for input and output of FileMaker elements is the fmxmlsnippet format which is used via the OS clipboard. This is the format that will is commonly used in order to get AI generated scripts and other elements back into FileMaker via the clipboard.

# Objective

The goals of this project is to provide the guidance and context needed by agentic processes for creating reliable scripts and other FileMaker related elements which can be taken from AI back into FileMaker Pro.
