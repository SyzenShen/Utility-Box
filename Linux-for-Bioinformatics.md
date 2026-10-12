<a id="en"></a>

# Linux for Bioinformatics

**A hands-on guide for beginners** · English first, [中文版在后面](#zh)

---

## About this guide

**Who this guide is for.** You work with sequencing data, or you will soon. You have never used a command line, or you used it only a little.

**What you will do.** You will make a small lab directory. You will look inside FASTQ files, count reads, and filter them. Then you will map reads to a reference with `bwa` and `samtools`. At the end you will write a script and run a long job on a server.

**How to use this guide.**

1. Open a terminal (chapter 2).
2. Type each command in order. Chapters 2 and 3 make the files that later chapters use.
3. Compare your output with the output in this guide.
4. Do the short exercises. The answers are hidden under each exercise.

**Signs in this guide.**

| Sign | Meaning |
|---|---|
| Code block | A command that you type. Do not type the `#` comments. |
| Grey `text` block | The output that you see. Your names, dates, and paths are different. `Mon DD HH:MM` stands for the date and time on your computer. |
| **Note** | Extra information. |
| **Caution** | A mistake here can destroy data or waste hours. |
| **Field note** | Advice from real use, including advice that appears in Chinese-language guides on Zhihu. |

**Test status.** We ran the commands of chapters 2 to 12 in a clean account on Ubuntu 24.04. Tool versions: bash 5.2, mawk 1.3.4, seqtk 1.4, samtools 1.19.2, bwa 0.7.17. We did not run the commands that need a real server: `ssh`, `scp`, Slurm, the `tmux` screen, and `top`. Those blocks show the standard syntax.

**Writing style.** This guide follows the main rules of ASD-STE100 (Simplified Technical English). Sentences are short and have one idea. We use active voice, and one word for one thing. We did not check the text against the official STE dictionary. The guide is *STE-style*, not *STE-certified*.

**Words used in this guide.**

| Word | Meaning |
|---|---|
| Terminal | The window where you type commands. |
| Shell | The program inside the terminal that reads your commands. Bash and zsh are shells. |
| Command | A program that you start from the shell. Example: `ls`. |
| Option | A letter after the command that changes its work. Example: `-l`. |
| Argument | The thing the command works on. Example: a file name. |
| Directory | A folder. |
| Path | The address of a file or a directory. Example: `/home/alice/data`. |
| Prompt | The text before the cursor, often ending in `$`. Do not type it. |

### Contents

1. [Why bioinformatics uses Linux](#1-why-bioinformatics-uses-linux)
2. [Get a Linux shell](#2-get-a-linux-shell)
3. [Move around and manage files](#3-move-around-and-manage-files)
4. [Look inside files](#4-look-inside-files)
5. [Pipes and redirection](#5-pipes-and-redirection)
6. [Text tools for sequence and table files](#6-text-tools-for-sequence-and-table-files)
7. [Permissions](#7-permissions)
8. [Install software and set up environments](#8-install-software-and-set-up-environments)
9. [Work on a remote server](#9-work-on-a-remote-server)
10. [Write a shell script](#10-write-a-shell-script)
11. [Mini project: check read quality and map reads](#11-mini-project-check-read-quality-and-map-reads)
12. [When something goes wrong](#12-when-something-goes-wrong)
13. [Safe habits](#13-safe-habits)
14. [Cheat sheet](#14-cheat-sheet)
15. [Learn more](#15-learn-more)

---

## 1. Why bioinformatics uses Linux

**Developers write most tools for Linux.** Programs such as BWA, samtools, STAR, and GATK run on Linux and on macOS. Many of them do not run directly on Windows. Windows users run them in WSL (chapter 2).

**Servers run Linux.** The computing server or cluster of your lab almost always runs Linux. You connect to it with a terminal. You must know the basic commands to work there.

**Files are many and large.** One sequencing run gives many files. Each file can have millions of lines. You cannot open each file with the mouse. One command can process 100 files.

**Commands are a record.** You can save commands in a text file. You can run the same file again next month. A colleague can run it too. This makes your work repeatable.

> **Field note: You do not need to learn all of Linux.**
>
> Several Zhihu guides give the same advice. Do not read a whole Linux book first. Learn this small set of skills:
>
> - Move between directories.
> - Copy and delete files.
> - Search and edit text with `grep`, `awk`, and `sed`.
> - Install software.
> - Understand paths.
>
> Learn the rest when you need it. This guide follows that advice.

---

## 2. Get a Linux shell

### 2.1 Choose your system

| Your computer | What to do |
|---|---|
| Windows 10 or 11 | Install WSL2 with Ubuntu. Open PowerShell as administrator, run `wsl --install`, and restart. Then open the "Ubuntu" app. |
| macOS | Open the *Terminal* app. Read the note below. |
| Linux | Open a terminal. |
| A remote server | Connect with `ssh` (chapter 9). |

> **Note for WSL users.** Your Windows drives are at `/mnt/c`, `/mnt/d`, and so on. Do your work in your Linux home directory (`~`). Work on `/mnt/c` is much slower.

> **Note for macOS users.** The default shell is zsh, not bash. Most commands in this guide work the same. macOS uses the BSD versions of some tools. A few options are different. Where this matters, the guide tells you. You can install the GNU versions with `brew install coreutils gawk gnu-sed`.

> **Field note: Practice on your own computer first.**
>
> Some Zhihu guides for beginners give the same advice. Use WSL or a virtual machine to practice before you touch a shared server. A mistake on your own computer costs nothing. A mistake on a shared server can cost your whole lab.

### 2.2 Install the tools for this guide

On Ubuntu or WSL:

<!-- notest -->
```bash
sudo apt update
sudo apt install -y seqtk samtools bwa
```

On macOS (with Homebrew):

<!-- notest -->
```bash
brew install seqtk samtools bwa
```

On a shared server you cannot use `sudo`. Use conda instead (chapter 8).

### 2.3 Your first commands

Type this command and press Enter:

```bash
echo "Hello, Linux"
```

```text
Hello, Linux
```

`echo` prints text. The word in quotes is the argument.

Two more commands show who you are and where you are:

```bash
whoami
pwd
```

```text
alice
/home/alice
```

`whoami` prints your user name. `pwd` prints the directory you are in now. Your output is different.

Look at the parts of a command:

```
ls   -l   data
│    │    └── argument: what to work on
│    └─────── option: how to work
└──────────── command: what to run
```

---

## 3. Move around and manage files

### 3.1 Make the lab

Run the next block. It makes a lab directory with three small files. The data is not real. It is only for learning.

- `reads.fastq` has 10 short reads.
- `ref.fa` is a reference sequence of 240 bases. All reads come from it, except one.
- `genes.tsv` is a table of 10 made-up genes.

The `cat > file <<'EOF'` pattern writes all lines up to `EOF` into the file. The `tr` line changes spaces to tabs. You will learn `tr` in chapter 6.

```bash
mkdir -p ~/linux-lab/{data,results,scripts}
cd ~/linux-lab

cat > data/reads.fastq <<'EOF'
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@read02
GCACGAAACTTGTTGGCCCAGTGTGAATCGCTTAAG
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIII??????
@read03
AAGTAAGTGTAATGCATACGCCTTTACTTGCTGTGT
+
IIIIIIIIII5IIIIIIIIIIIIIIIIIIIIIIIII
@read04
TGTTTCTGAGTGTAATAAAAATGCCAGTCCGATGGG
+
????????????????????????????????????
@read05
TCGGGTAATTTTGACAGGTCACGCAGAGGCGCGCCC
+
IIIIIIIIIIIIIIIIIIII??????????555555
@read06
GACACTCGCTATGAATCTCTGATTTACCCACTCTGC
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@read07
CCTTNNNTTGCTGTGTCCACCCCATCGGACTGGCAT
+
IIII###555555555555#################
@read08
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGTAC
+
555555555555555555555555555555555555
@read09
TGGCATTTTTATTACACTCAGA
+
IIIIIIIIIIIIIIIIIIIIII
@read10
ACGCAGAGGCGCGCCCTCCTGAAGTGCGTGGACACT
+
????????????????????????????????????
EOF

cat > data/ref.fa <<'EOF'
>demo_ref length=240
GCTAAAGACAATTACATAACATACACGTCAGCACGAAACTTGTTGGCCCAGTGTGAATCG
CTTAAGGGTTAAGTAAGTGTGATGCATACGCCTTTACTTGCTGTGTCCACCCCATCGGAC
TGGCATTTTTATTACACTCAGAAACAGAACTCGGGTAATTTTGACAGGTCACGCAGAGGC
GCGCCCTCCTGAAGTGCGTGGACACTCGCTATGAATCTCTGATTTACCCACTCTGCCAAA
EOF

cat > data/genes.txt <<'EOF'
gene_id chrom start end strand biotype tpm
GENE001 chr1 1200 5400 + protein_coding 35.2
GENE002 chr1 8800 9900 - lncRNA 1.4
GENE003 chr1 15000 22000 + protein_coding 120.8
GENE004 chr2 500 3200 - protein_coding 8.9
GENE005 chr2 7000 7600 + miRNA 0.3
GENE006 chr2 12000 18500 + protein_coding 56.0
GENE007 chr3 2000 2900 - lncRNA 4.7
GENE008 chr3 9000 14000 + protein_coding 0.0
GENE009 chrX 300 4300 - protein_coding 77.5
GENE010 chrX 6000 6400 + miRNA 2.1
EOF
tr -s ' ' '\t' < data/genes.txt > data/genes.tsv
rm data/genes.txt
```

Check the result:

```bash
ls -l data
```

```text
total 12
-rw-r--r-- 1 alice alice 457 Mon DD HH:MM genes.tsv
-rw-r--r-- 1 alice alice 812 Mon DD HH:MM reads.fastq
-rw-r--r-- 1 alice alice 265 Mon DD HH:MM ref.fa
```

If the sizes (457, 812, 265) are the same as yours, the files are correct.

### 3.2 Where am I?

Three commands tell you where you are and what is there:

| Command | What it does |
|---|---|
| `pwd` | Prints the path of the current directory. |
| `ls` | Lists the files in the current directory. |
| `cd DIR` | Goes into the directory `DIR`. |

```bash
pwd
ls
```

```text
/home/alice/linux-lab
data  results  scripts
```

A *path* tells the shell where a file is. There are two kinds:

- An **absolute path** starts with `/`. Example: `/home/alice/linux-lab/data`. It works from every place.
- A **relative path** does not start with `/`. Example: `data/ref.fa`. It starts from the directory you are in now.

Four short names help you:

| Name | Meaning |
|---|---|
| `~` | Your home directory. |
| `.` | The current directory. |
| `..` | The parent directory (one level up). |
| `-` | With `cd`: the last directory you were in. |

```bash
cd data
pwd
ls ..
cd ..
pwd
```

```text
/home/alice/linux-lab/data
data  results  scripts
/home/alice/linux-lab
```

Hidden files start with a dot. Use `ls -a` to see them:

```bash
ls -a ~
```

```text
.  ..  linux-lab
```

> **Tip: Use the Tab key.** Type the first letters of a name and press Tab. The shell completes the name. Press Tab twice to see all choices. This saves time and prevents typing errors.

### 3.3 Make, copy, move, and delete

| Command | What it does | Example |
|---|---|---|
| `mkdir -p` | Makes a directory (and the parent directories). | `mkdir -p results/qc` |
| `cp` | Copies a file. Use `-r` for a directory. | `cp a.txt b.txt` |
| `mv` | Moves or renames a file. | `mv a.txt c.txt` |
| `rm` | Deletes a file. Use `-r` for a directory. | `rm c.txt` |
| `touch` | Makes an empty file. | `touch notes.txt` |

```bash
cp data/reads.fastq results/reads_copy.fastq
mv results/reads_copy.fastq results/reads_backup.fastq
ls results
```

```text
reads_backup.fastq
```

```bash
rm results/reads_backup.fastq
ls results
```

The last `ls` prints nothing, because `results` is empty now.

The star `*` stands for any text. The shell replaces `*.tmp` with the names of all matching files **before** the command runs. Use this to test a delete command safely. Put `echo` in front of it:

```bash
touch results/a.tmp results/b.tmp
ls results/*.tmp
echo rm results/*.tmp
rm results/*.tmp
```

```text
results/a.tmp  results/b.tmp
rm results/a.tmp results/b.tmp
```

`echo` only prints the command. It shows you the files that `rm` will delete.

> **Caution: Linux has no Recycle Bin.** `rm` deletes files at once. You cannot get them back. On many servers nobody makes a backup of your files.
>
> Follow these rules:
> 1. Run `ls` with the same pattern first. Look at the list.
> 2. Put `echo` before `rm` when you use `*`.
> 3. Do not use `rm -f` unless you are sure. It hides all warnings.
> 4. Never run `rm -rf "$DIR"/*` when `$DIR` can be empty. An empty variable can turn the command into `rm -rf /*`.

> **Field note: Most delete disasters are small mistakes.**
>
> Zhihu threads about `rm -rf` accidents often name an extra space or an incomplete path as the cause. A wrong current directory or an empty variable can do the same damage.
>
> If you see a wrong result after you press Enter, press Ctrl+C at once. Then stop writing to that disk. Ask your administrator before you try anything else. Recovery tools exist, but they often fail. Backups are the only safe plan.

### 3.4 Good file names

Use only letters, digits, `_`, `-`, and `.` in file names. Do not use spaces. A space splits one name into two arguments:

```bash
cd results
touch "my file.txt"
rm my file.txt
```

```text
rm: cannot remove 'my': No such file or directory
rm: cannot remove 'file.txt': No such file or directory
```

The shell reads `my` and `file.txt` as two files. Use quotes to fix it, and then use a better name:

```bash
rm "my file.txt"
cd ..
```

### 3.5 Edit a text file

Use `nano` for small edits. It shows the key commands at the bottom of the screen. The `^` sign means the Ctrl key.

<!-- notest -->
```bash
nano notes.txt
```

| Keys | Action |
|---|---|
| Ctrl+O, then Enter | Save the file. |
| Ctrl+X | Leave nano. |
| Ctrl+W | Search. |

You will meet `vim` sometimes, for example when Git or `crontab` opens it. You need only four steps to survive:

1. Press `i` to start typing.
2. Type your text.
3. Press `Esc` to stop typing.
4. Type `:wq` and press Enter to save and leave. Type `:q!` and press Enter to leave without saving.

> **Field note.** "How do I leave Vim?" is a famous joke among programmers. Now you know the answer.

### 3.6 The map of the file system

Everything starts at `/` (the root). These places matter most:

| Path | What is there |
|---|---|
| `/home/alice` | Your home directory (also written `~`). Your files live here. |
| `/tmp` | Temporary files. The system can delete them at any time. |
| `/etc` | System settings. |
| `/usr/bin` | Most programs. |
| `/mnt/c` | The Windows `C:` drive (WSL only). |

> **Field note: On a cluster, your home directory is often small.**
>
> Put large data on the project or scratch disk. Names differ between sites (`/data`, `/scratch`, `/project`). Ask your administrator. Some clusters delete old files on scratch disks automatically. Read your site rules.

### 3.7 Get help

You do not need to remember every option. Look them up:

<!-- notest -->
```bash
ls --help        # short help
man ls           # full manual. Press q to leave.
type cd          # shows what kind of command this is
which samtools   # shows where a program is
```

If you do not understand an error message, copy it into a search engine. Many people saw it before you.

---

## 4. Look inside files

### 4.1 What a FASTQ file looks like

A FASTQ file stores sequencing reads. Each read uses four lines:

```
@read01                                  line 1: read name (starts with @)
GCTAAAGACAATTACATAACATACACGTCAGCACGA    line 2: bases
+                                        line 3: separator
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII    line 4: quality, one character for each base
```

Each quality character is a number. The number is the ASCII code of the character, minus 33. This number is the Phred score **Q**. A higher Q means a lower chance of an error.

| Character | Q | Chance that the base is wrong |
|---|---|---|
| `I` | 40 | 1 in 10 000 |
| `?` | 30 | 1 in 1 000 |
| `5` | 20 | 1 in 100 |
| `#` | 2 | About 3 in 5 |

### 4.2 Show the start, the end, and the size

```bash
head -n 4 data/reads.fastq
```

```text
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```

```bash
tail -n 4 data/reads.fastq
wc -l data/reads.fastq
```

```text
@read10
ACGCAGAGGCGCGCCCTCCTGAAGTGCGTGGACACT
+
????????????????????????????????????
40 data/reads.fastq
```

`head` shows the first lines. `tail` shows the last lines. `wc -l` counts lines. The file has 40 lines. Each read uses 4 lines, so the file has 10 reads.

### 4.3 Read a long file with `less`

<!-- notest -->
```bash
less data/reads.fastq
```

Use `less` to read long files. It shows one screen at a time.

| Key | Action |
|---|---|
| Space | Next page. |
| `b` | Previous page. |
| `/ACGT` then Enter | Search for ACGT. |
| `q` | Leave. |

Use `less -S` to stop long lines from wrapping.

> **Field note.** Never open a 30 GB FASTQ file in a text editor. The computer will freeze. `less` reads only what you see on the screen. `cat` prints the whole file, so use it only for small files.

### 4.4 Compressed files

Most sequencing files end in `.gz`. These files use less space. Do not unpack them. Read them with `gzip -dc`, which prints the unpacked text:

```bash
gzip -c data/reads.fastq > results/reads.fastq.gz
ls -l results
gzip -dc results/reads.fastq.gz | head -n 2
```

```text
total 4
-rw-r--r-- 1 alice alice 269 Mon DD HH:MM reads.fastq.gz
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
```

Here `gzip -c` writes to the screen. The `>` sign sends that text into a new file. You learn more about `>` in chapter 5.

> **Note.** On Linux you can also use `zcat` or `zless`. On macOS `zcat` expects other file types, so use `gzip -dc` there.

### 4.5 Disk space

Large data can fill a disk. Check the space often:

<!-- nocompare -->
```bash
df -h .
du -sh data
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda        252G  9.1G   30G  24% /
16K	data
```

`df -h .` shows the free space on the disk that holds the current directory. `du -sh data` shows how much space the directory `data` uses.

### 4.6 Show a table in columns

```bash
column -t data/genes.tsv | head -n 4
```

```text
gene_id  chrom  start  end    strand  biotype         tpm
GENE001  chr1   1200   5400   +       protein_coding  35.2
GENE002  chr1   8800   9900   -       lncRNA          1.4
GENE003  chr1   15000  22000  +       protein_coding  120.8
```

`column -t` lines up the columns. The file itself does not change.

---

## 5. Pipes and redirection

This chapter is the key to the rest of the guide. Each Linux command does one small job. Pipes and redirection join the commands.

### 5.1 Three streams

Every command has three data streams:

| Stream | Number | Default place |
|---|---|---|
| Standard input (stdin) | 0 | Keyboard |
| Standard output (stdout) | 1 | Screen |
| Standard error (stderr) | 2 | Screen |

### 5.2 Redirect to a file

| Sign | Action |
|---|---|
| `>` | Write output to a file. **It replaces the old content.** |
| `>>` | Add output to the end of a file. |
| `<` | Read input from a file. |
| `2>` | Write error messages to a file. |
| `2>&1` | Send errors to the same place as normal output. |

```bash
echo "hello" > results/note.txt
echo "world" >> results/note.txt
cat results/note.txt
```

```text
hello
world
```

```bash
ls data/missing.txt 2> results/err.txt
echo "exit code: $?"
cat results/err.txt
```

```text
exit code: 2
ls: cannot access 'data/missing.txt': No such file or directory
```

Every command returns an *exit code*. Zero means success. Any other number means an error. The variable `$?` holds the code of the last command.

> **Caution: Never write to the file that you read.** The shell opens and empties the output file *before* the command starts. The command then reads an empty file. All data is gone. The next demo uses a copy, so your data is safe.

```bash
cp data/genes.tsv results/test.tsv
sort results/test.tsv > results/test.tsv
wc -c < results/test.tsv
```

```text
0
```

The file has 0 bytes now. Write to a new file instead: `sort a.tsv > a.sorted.tsv`.

### 5.3 Join commands with a pipe

The pipe sign `|` sends the output of one command into the next command. Count the gene types in `genes.tsv` in five steps:

| Step | Command | Result |
|---|---|---|
| 1 | `cut -f 6 data/genes.tsv` | Column 6 (the type). |
| 2 | `\| tail -n +2` | Remove the header line. |
| 3 | `\| sort` | Put the same types together. |
| 4 | `\| uniq -c` | Count the same lines. |
| 5 | `\| sort -k1,1nr` | Sort by the count, largest first. |

```bash
cut -f 6 data/genes.tsv | tail -n +2 | sort | uniq -c | sort -k1,1nr
```

```text
      6 protein_coding
      2 lncRNA
      2 miRNA
```

Build a long pipe step by step. Run the first command. Add one more command. Look at the output. Repeat.

> **Field note.** In our view, the pipe is the most useful idea in this guide. After you know it, you can solve many small data tasks in one line. You do not need Excel or a new script.

### 5.4 Run commands in order

| Sign | Meaning |
|---|---|
| `a ; b` | Run `a`, then run `b`. |
| `a && b` | Run `b` only if `a` succeeded. |
| `a \|\| b` | Run `b` only if `a` failed. |

```bash
ls data/ref.fa && echo "found"
ls data/none.fa 2> /dev/null || echo "missing"
```

```text
data/ref.fa
found
missing
```

`/dev/null` is a special file that deletes everything you write to it. Use it to hide messages that you do not need.

### 5.5 Variables, quotes, and substitution

```bash
name="read01"
echo "id: $name"
echo 'id: $name'
echo "reads: $(grep -c '^@read' data/reads.fastq)"
```

```text
id: read01
id: $name
reads: 10
```

- Do not put spaces around `=` when you set a variable.
- Double quotes `"..."` replace variables. Single quotes `'...'` do not.
- `$(command)` runs the command and puts its output in the place of `$(command)`.
- Always put `"$name"` in quotes when you use it. A name with a space then stays in one piece.

### 5.6 Exercise

**Exercise 5.1.** How many genes are on each chromosome?

<details>
<summary>Answer</summary>

```bash
cut -f 2 data/genes.tsv | tail -n +2 | sort | uniq -c
```

```text
      3 chr1
      3 chr2
      2 chr3
      2 chrX
```

</details>

---

## 6. Text tools for sequence and table files

Most bioinformatics files are plain text. These tools work on all of them.

| Tool | Main job |
|---|---|
| `grep` | Find lines that match a pattern. |
| `cut` | Cut out columns. |
| `sort`, `uniq` | Order lines, count the same lines. |
| `tr` | Change or delete single characters. |
| `awk` | Work with columns, conditions, and sums. |
| `sed` | Replace text, select lines. |
| `find`, `xargs` | Find files and run a command on them. |

### 6.1 `grep`: find lines

| Option | Meaning |
|---|---|
| `-c` | Count the matching lines. |
| `-n` | Show line numbers. |
| `-v` | Show the lines that do **not** match. |
| `-i` | Ignore upper and lower case. |
| `-A 2`, `-B 1` | Also show 2 lines after, or 1 line before, each match. |
| `-E` | Use extended patterns (`a\|b`). |

In a pattern, `^` means "start of the line".

```bash
grep -c '^@read' data/reads.fastq
grep -n '^@read' data/reads.fastq | head -n 3
grep -B1 -A2 'NNN' data/reads.fastq
```

```text
10
1:@read01
5:@read02
9:@read03
@read07
CCTTNNNTTGCTGTGTCCACCCCATCGGACTGGCAT
+
IIII###555555555555#################
```

> **Caution.** The first command works here only because all read names start with `@read`. In real data, a quality line can also start with `@`. To count reads in a FASTQ file, divide the line count by 4.

### 6.2 `cut`, `sort`, `uniq`

`cut -f` selects tab-separated columns. For files with commas, add `-d,`.

```bash
cut -f 1,7 data/genes.tsv | head -n 3
sort -t$'\t' -k7,7nr data/genes.tsv | head -n 4 | cut -f 1,7
```

```text
gene_id	tpm
GENE001	35.2
GENE002	1.4
GENE003	120.8
GENE009	77.5
GENE006	56.0
GENE001	35.2
```

In `sort`, `-t` sets the column separator, `-k7,7` selects column 7, `n` means "number", and `r` means "reverse".

### 6.3 `tr`: change characters

The reverse complement of a DNA sequence is a common task. `rev` reverses the text. `tr` swaps each base for its partner:

```bash
echo ACGTNacgt | rev | tr ACGTacgt TGCAtgca
```

```text
acgtNACGT
```

You can also delete characters. This command counts the bases of the reference without the header line and the line breaks:

```bash
grep -v '^>' data/ref.fa | tr -d '\n' | wc -c
```

```text
240
```

### 6.4 `awk`: work with columns

`awk` reads a file line by line. It splits each line into fields called `$1`, `$2`, and so on. `$0` is the whole line. A program has the form `condition { action }`.

| Part | Meaning |
|---|---|
| `-F'\t'` | Fields are separated by tabs. |
| `NR` | The number of the current line. |
| `NF` | The number of fields in the line. |
| `BEGIN { ... }` | Runs before the first line. |
| `END { ... }` | Runs after the last line. |

Select rows and columns:

```bash
awk -F'\t' 'NR>1 && $6=="protein_coding" {print $1, $7}' data/genes.tsv
```

```text
GENE001 35.2
GENE003 120.8
GENE004 8.9
GENE006 56.0
GENE008 0.0
GENE009 77.5
```

Calculate a mean, and compute the length of each gene:

```bash
awk -F'\t' 'NR>1 {sum+=$7} END {print "mean TPM:", sum/(NR-1)}' data/genes.tsv
awk -F'\t' 'BEGIN{OFS="\t"} NR>1 {print $1, $4-$3+1}' data/genes.tsv | head -n 3
```

```text
mean TPM: 30.69
GENE001	4201
GENE002	1101
GENE003	7001
```

Count rows for each value with an array:

```bash
awk -F'\t' 'NR>1 {n[$6]++} END {for (k in n) print k, n[k]}' data/genes.tsv | sort
```

```text
lncRNA 2
miRNA 2
protein_coding 6
```

A FASTQ file has 4 lines for each read. The line number modulo 4 tells you the type of the line. The next commands print the length of each sequence, and then count how often each length occurs:

```bash
awk 'NR%4==2 {print length($0)}' data/reads.fastq | sort -n | uniq -c
```

```text
      1 22
      9 36
```

> **Field note.** `awk` looks hard on the first day. Start with only three things: `-F` for the separator, `$N` for a column, and a condition before the braces. These three cover most daily jobs.

### 6.5 `sed`: replace and select

```bash
sed '1!s/chr//' data/genes.tsv | cut -f 2 | head -n 3
sed -n '2,3p' data/genes.tsv | cut -f 1-3
sed '1d' data/genes.tsv | head -n 2 | cut -f 1
```

```text
chrom
1
1
GENE001	chr1	1200
GENE002	chr1	8800
GENE001
GENE002
```

- `s/old/new/` replaces the first `old` in each line. Add `g` to replace all.
- `1!` means "on all lines except line 1". We kept the header line in this way.
- `-n '2,3p'` prints only lines 2 to 3.
- `1d` deletes line 1.

> **Caution: `sed -i` is different on macOS.** `sed -i` edits a file in place. On Linux write `sed -i 's/a/b/' file`. On macOS write `sed -i '' 's/a/b/' file`. To be safe, write to a new file and then rename it.

### 6.6 `find` and `xargs`

```bash
find data -name "*.fa" -o -name "*.tsv" | sort
find data -name "*.fastq" -print0 | xargs -0 ls -l
```

```text
data/genes.tsv
data/ref.fa
-rw-r--r-- 1 alice alice 812 Mon DD HH:MM data/reads.fastq
```

`find` looks for files by name, size, or age. `xargs` takes the file names and runs a command on them. The options `-print0` and `-0` keep names with spaces safe.

### 6.7 Exercises

**Exercise 6.1.** Save the IDs of genes with TPM above 50 in the file `results/high_tpm.txt`.

<details>
<summary>Answer</summary>

```bash
awk -F'\t' 'NR>1 && $7>50 {print $1}' data/genes.tsv > results/high_tpm.txt
cat results/high_tpm.txt
```

```text
GENE003
GENE006
GENE009
```

</details>

**Exercise 6.2.** Which reads have fewer than 30 bases?

<details>
<summary>Answer</summary>

```bash
awk 'NR%4==1 {id=$1} NR%4==2 && length($0)<30 {print id, length($0)}' data/reads.fastq
```

```text
@read09 22
```

</details>

**Exercise 6.3.** Find the reverse complement of `GATTACA`.

<details>
<summary>Answer</summary>

```bash
echo GATTACA | rev | tr ACGT TGCA
```

```text
TGTAATC
```

</details>

---

## 7. Permissions

### 7.1 Read the permission string

Every file has an owner, a group, and a set of permissions. `ls -l` shows them:

```bash
cat > scripts/hello.sh <<'EOF'
#!/usr/bin/env bash
echo "Hello from a script"
EOF
ls -l scripts/hello.sh
```

```text
-rw-r--r-- 1 alice alice 47 Mon DD HH:MM scripts/hello.sh
```

```
-  rw-  r--  r--   1   alice  alice   47   Mon DD HH:MM   scripts/hello.sh
│  │    │    │         │      │       │    │              └── name
│  │    │    │         │      │       │    └── date
│  │    │    │         │      │       └── size in bytes
│  │    │    │         │      └── group
│  │    │    │         └── owner
│  │    │    └── permissions for everyone else
│  │    └── permissions for the group
│  └── permissions for the owner
└── type: - is a file, d is a directory
```

The three letters are `r` (read), `w` (write), and `x` (run, or enter for a directory).

### 7.2 Change permissions with `chmod`

The new script cannot run, because it has no `x`:

```bash
./scripts/hello.sh
```

```text
bash: ./scripts/hello.sh: Permission denied
```

Add the `x` permission:

```bash
chmod +x scripts/hello.sh
ls -l scripts/hello.sh
./scripts/hello.sh
```

```text
-rwxr-xr-x 1 alice alice 47 Mon DD HH:MM scripts/hello.sh
Hello from a script
```

You can also write permissions as numbers. Read is 4, write is 2, and run is 1. Add them for each group:

| Number | Owner | Group | Others | Use |
|---|---|---|---|---|
| `644` | rw- | r-- | r-- | Normal files |
| `755` | rwx | r-x | r-x | Scripts, programs, directories |
| `600` | rw- | --- | --- | Private keys |
| `700` | rwx | --- | --- | Private directories |

A directory needs the `x` permission, or nobody can enter it.

### 7.3 Protect your raw data

Raw data must not change. Remove the write permission:

```bash
chmod a-w data/reads.fastq
echo "oops" >> data/reads.fastq
```

```text
bash: data/reads.fastq: Permission denied
```

```bash
chmod u+w data/reads.fastq
```

The last command gives the write permission back to you. You need it later in this guide.

### 7.4 About `sudo`

`sudo` runs one command as the administrator. You need it on your own computer to install system software. You do not have it on most shared servers, and you do not need it for daily work.

> **Caution.** Do not use `chmod 777`. It gives everybody the right to write. If a command says `Permission denied`, find the cause. Often another person owns the file, and the block is on purpose. Ask the owner before you change shared data.

---

## 8. Install software and set up environments

### 8.1 Where do commands live?

When you type `samtools`, the shell looks in a list of directories. The list is in the variable `PATH`. Make a small program in your own `~/bin` directory, and add `~/bin` to `PATH`:

```bash
mkdir -p ~/bin
cat > ~/bin/hi <<'EOF'
#!/usr/bin/env bash
echo "hi from ~/bin"
EOF
chmod +x ~/bin/hi
hi
```

```text
bash: hi: command not found
```

The shell does not know `~/bin` yet. Add it to `PATH` for this terminal:

```bash
export PATH="$HOME/bin:$PATH"
hi
which hi
```

```text
hi from ~/bin
/home/alice/bin/hi
```

You lose this change when you close the terminal. To keep it, add the `export` line to the file `~/.bashrc` (for zsh on macOS: `~/.zshrc`):

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
tail -n 1 ~/.bashrc
```

```text
export PATH="$HOME/bin:$PATH"
```

Then run `source ~/.bashrc` or open a new terminal.

### 8.2 System packages

On Ubuntu, `apt` installs software for the whole computer. It needs `sudo`.

<!-- notest -->
```bash
sudo apt update
sudo apt install -y samtools
```

Servers often cannot reach the internet. If an install fails, try a mirror. You can also download the files on your own computer and copy them to the server (chapter 9).

### 8.3 Conda and Bioconda

Bioinformatics tools need many other libraries. The versions often conflict. **Conda** solves this. It makes a separate *environment* for each project. **Bioconda** is a large collection of bioinformatics tools for conda.

Install Miniforge. It uses the `conda-forge` channel by default.

<!-- notest -->
```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

Close the terminal and open it again. Then make an environment for a project:

<!-- notest -->
```bash
conda create -n qc -c conda-forge -c bioconda seqtk samtools   # make the environment
conda activate qc                                              # go into it
seqtk                                                          # the tool now works
conda deactivate                                               # leave it
```

The order of `-c` options sets the priority: `conda-forge` first, then `bioconda`. We tested this command line with `micromamba`, which uses the same options.

Save the environment, so that others can make the same one:

<!-- notest -->
```bash
conda env export --from-history > environment.yml
conda env create -f environment.yml
```

> **Field note: Rules that save hours.** Several of these rules also appear in Zhihu guides about Bioconda.
> 1. **Do not install tools into the `base` environment.** Make one environment for each project or tool. A conflict then cannot spoil everything.
> 2. **Write down the versions.** The newest version is not always the best. A paper needs the same version to give the same result.
> 3. **Do not mix installers.** Do not use `pip` or `install.packages` inside a conda environment unless you must.
> 4. **Use a mirror if your network is slow.** Universities in China often run conda mirrors. Mirror addresses change, so read the page of the mirror site.
> 5. **Old guides can be wrong.** Conda and Bioconda change their advice over time. Check the Bioconda website.

### 8.4 Containers

A container holds a program and all its libraries in one package. You can use Docker on your own computer. Many clusters do not allow Docker, because it needs administrator rights. They offer **Apptainer** (earlier name: Singularity) instead.

---

## 9. Work on a remote server

### 9.1 Connect with `ssh`

<!-- notest -->
```bash
ssh alice@server.example.org
```

The first time, `ssh` asks if you trust the server. Type `yes`. Then enter your password. Type `exit` to leave the server.

A key pair is safer than a password and saves typing. Make a key on your own computer. The directory `~/.ssh` must be private (`700`), or `ssh` refuses to use your keys:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -q -t ed25519 -C "alice@laptop" -f ~/.ssh/id_ed25519 -N ""
ls ~/.ssh
```

```text
id_ed25519  id_ed25519.pub
```

The `-N ""` option sets an empty passphrase. We use it only so that the demo runs without a question. For a real key, remove `-N ""` and enter a passphrase when `ssh-keygen` asks. If the file `~/.ssh/id_ed25519` exists already, do not overwrite it. Choose another name with `-f`.

The file `id_ed25519` is your **private key**. Never send it to anyone. The file `id_ed25519.pub` is the **public key**. Copy the public key to the server:

<!-- notest -->
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@server.example.org
```

Make a short name for the server. Put this in the file `~/.ssh/config`:

```
Host lab
    HostName server.example.org
    User alice
    ServerAliveInterval 60
```

Now `ssh lab` is enough. `ServerAliveInterval 60` sends a small signal every 60 seconds. It helps to keep idle connections open.

### 9.2 Copy files

| Command | Use |
|---|---|
| `scp file lab:dir/` | Copy one file to the server. |
| `scp lab:dir/file .` | Copy one file from the server to the current directory. |
| `rsync -avhP src/ lab:dir/` | Copy a directory. Copy only the changes. Continue after a break. |

<!-- notest -->
```bash
scp data/reads.fastq lab:/home/alice/linux-lab/data/
rsync -avhP data/ lab:/home/alice/linux-lab/data/
```

`rsync` does not copy files that did not change. You can run it again after a break, and it continues. The next demo uses two local directories to show this:

<!-- nocompare -->
```bash
rsync -avh data/ results/data_copy/ | tail -n 3
rsync -avh data/ results/data_copy/ | tail -n 3
```

```text
sent 1.78K bytes  received 76 bytes  3.72K bytes/sec
total size is 1.53K  speedup is 0.83
sent 113 bytes  received 12 bytes  250.00 bytes/sec
total size is 1.53K  speedup is 12.27
```

Your numbers are different. The second run sends only a few bytes, because nothing changed.

> **Caution: The slash at the end of the path matters.** `rsync -a src/ dst/` copies the *content* of `src` into `dst`. `rsync -a src dst/` makes a new directory `dst/src`. Many people make this mistake once.

After a big copy, compare checksums. A checksum is a short code that depends on the file content:

```bash
cd data
sha256sum genes.tsv ref.fa > ../results/checksums.txt
sha256sum -c ../results/checksums.txt
cd ..
```

```text
genes.tsv: OK
ref.fa: OK
```

On macOS use `shasum -a 256` instead of `sha256sum`.

> **Field note: Many servers cannot reach the internet.**
>
> Download the data on your own computer or on a gateway machine. Then copy it with `scp` or `rsync`. The same trick works for software packages.

### 9.3 Keep a job alive after you disconnect

When your connection drops, the server sends a hangup signal (SIGHUP) to your shell. The shell then stops all programs that it started. A 10-hour alignment can die in this way.

Two tools prevent this.

**`tmux`** keeps a terminal session on the server. You can leave and come back.

<!-- notest -->
```bash
tmux new -s align        # start a session named "align"
# ... run your long command here ...
# press Ctrl+b, then press d, to detach
tmux ls                  # list sessions
tmux attach -t align     # come back
```

**`nohup`** starts one command that ignores the hangup signal. Send the output to a log file:

```bash
cat > scripts/slow.sh <<'EOF'
#!/usr/bin/env bash
for i in 1 2 3; do
  echo "step $i"
  sleep 1
done
echo "done"
EOF
chmod +x scripts/slow.sh
nohup ./scripts/slow.sh > results/slow.log 2>&1 &
```

<!-- nocompare -->
```text
[1] 12345
```

The `&` at the end starts the command in the background. The shell prints the job number and the process ID (PID). Your numbers are different. The command keeps running if you close the terminal. Look at the log:

<!-- nocompare -->
```bash
sleep 4
cat results/slow.log
```

```text
step 1
step 2
step 3
done
```

| | `tmux` | `nohup` |
|---|---|---|
| Come back and look at the screen | Yes | No (read the log) |
| Good for | Tasks that you want to watch | Simple jobs that you start and leave |
| Survives a server restart | No | No |

> **Field note.** Several Zhihu guides give this advice: use `tmux` when you want to watch or fix a job. Use `nohup` for a simple job. In both cases, save the output in a log file. Without a log you cannot find out why a job failed.

Other useful job commands:

| Command | Action |
|---|---|
| `jobs` | List jobs of this terminal. |
| `Ctrl+Z`, then `bg` | Pause the running command, then continue it in the background. |
| `fg` | Bring a background job to the front. |
| `ps -u $USER` | List your processes. |
| `kill PID` | Ask a process to stop. Get the PID from `ps`. |
| `kill -9 PID` | Force a process to stop. Use it as the last choice. |
| `Ctrl+C` | Stop the command in front. |

### 9.4 Job schedulers (Slurm)

A cluster has a **login node** and many **compute nodes**. The login node is for editing files and starting jobs. **Do not run heavy work on the login node.** All users share it. Send heavy work to the compute nodes with a scheduler. Slurm is a common one.

Write a job script. The lines that start with `#SBATCH` are settings:

<!-- notest -->
```bash
#!/usr/bin/env bash
#SBATCH --job-name=map
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=04:00:00
#SBATCH --output=%x_%j.log

set -euo pipefail
bwa mem -t "$SLURM_CPUS_PER_TASK" ref.fa reads.fastq | samtools sort -o sorted.bam -
```

<!-- notest -->
```bash
sbatch job.sh          # send the job
squeue -u $USER        # look at your jobs
scancel 123456         # cancel job number 123456
sacct -j 123456        # see the result after the job ends
```

> **Caution.** Partition names, memory limits, and time limits differ between clusters. Read the guide of your site. If you do not know the limits, ask before you start a big job.

### 9.5 Check the computer

| Command | Shows |
|---|---|
| `nproc` | The number of CPU cores. |
| `free -h` | Memory use. |
| `df -h .` | Free disk space. |
| `du -sh * \| sort -h` | The size of each item here, smallest first. |
| `top` (or `htop`) | Running processes. Press `q` to leave. |
| `uptime` | The load of the computer. |

Check the load before you start a job. Do not use all cores of a shared computer without permission.

---

## 10. Write a shell script

A script is a text file with commands. You can run it again and again. It also records what you did.

### 10.1 The first lines

<!-- notest -->
```bash
#!/usr/bin/env bash
set -euo pipefail
```

- The first line is the *shebang*. It tells the system to use bash.
- `set -e` stops the script when a command fails.
- `set -u` stops the script when you use a variable that you did not set.
- `set -o pipefail` makes a pipe fail when any command in it fails.

### 10.2 A script that counts reads

This script takes one or more FASTQ files as arguments. It prints the read count of each file. It also reads `.gz` files.

```bash
cat > scripts/count_reads.sh <<'EOF'
#!/usr/bin/env bash
# Count reads in FASTQ files (plain or .gz).
# Usage: scripts/count_reads.sh file1.fastq [file2.fastq.gz ...]
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 file1.fastq [file2.fastq.gz ...]" >&2
  exit 1
fi

for fq in "$@"; do
  case "$fq" in
    *.gz) lines=$(gzip -dc "$fq" | wc -l) ;;
    *)    lines=$(wc -l < "$fq") ;;
  esac
  printf '%s\t%d\n' "$(basename "$fq")" "$((lines / 4))"
done
EOF
chmod +x scripts/count_reads.sh
./scripts/count_reads.sh data/reads.fastq results/reads.fastq.gz
```

```text
reads.fastq	10
reads.fastq.gz	10
```

Read the script line by line:

| Part | Meaning |
|---|---|
| `$#` | The number of arguments. |
| `$0` | The name of the script. |
| `"$@"` | All arguments, each one kept as one piece. |
| `for fq in ...; do ... done` | Repeat the commands for each file. |
| `case ... esac` | Choose by the file name. `*.gz` matches names that end in `.gz`. |
| `>&2` | Send the message to the error stream. |
| `exit 1` | Stop with an error code. |

Call the script without arguments to see the usage message:

```bash
./scripts/count_reads.sh
echo "exit code: $?"
```

```text
Usage: ./scripts/count_reads.sh file1.fastq [file2.fastq.gz ...]
exit code: 1
```

> **Caution: Scripts from Windows can have the wrong line ends.**
>
> Windows ends each line with two characters (CR and LF). Linux uses only LF. A script with CR gives an error like `env: 'bash\r': No such file or directory`. Fix it with `tr -d '\r' < old.sh > new.sh`. Most editors have a setting for the line ending. Choose "LF".

### 10.3 Next steps

- Use `shellcheck` (`sudo apt install shellcheck`) to find mistakes in scripts.
- Put the commands for each step in separate scripts. Test each script with a small input.
- When you have many samples and many steps, use a workflow manager. **Snakemake** and **Nextflow** are two common choices. Learn the shell script first. A workflow manager is easier to understand after that.

> **Field note.** A script is a to-do list that a computer can read. In three months, you will not remember what you typed today. The script will.

---

## 11. Mini project: check read quality and map reads

You now know enough to do a small real analysis. The steps are the same as in a real project:

1. Make a quality table for the reads.
2. Remove bad reads.
3. Map the good reads to the reference.
4. Read the result.

### 11.1 Make a quality table

The script below prints, for each read, its length, its GC content, and its mean quality. The `awk` program builds a table that turns each quality character into its Q score.

```bash
cat > scripts/fastq_qc.sh <<'EOF'
#!/usr/bin/env bash
# Print a small QC table for one FASTQ file.
# Usage: scripts/fastq_qc.sh data/reads.fastq
set -euo pipefail

fastq="$1"

printf 'read\tlength\tGC_percent\tmean_quality\n'
awk '
  BEGIN { for (i = 33; i < 127; i++) ord[sprintf("%c", i)] = i - 33 }
  NR % 4 == 1 { id = substr($1, 2) }
  NR % 4 == 2 { len = length($0); s = $0; gc = gsub(/[GCgc]/, "", s) }
  NR % 4 == 0 {
    q = 0
    for (i = 1; i <= length($0); i++) q += ord[substr($0, i, 1)]
    printf "%s\t%d\t%.1f\t%.1f\n", id, len, 100 * gc / len, q / length($0)
  }
' "$fastq"
EOF
chmod +x scripts/fastq_qc.sh
./scripts/fastq_qc.sh data/reads.fastq | column -t
```

```text
read    length  GC_percent  mean_quality
read01  36      38.9        40.0
read02  36      50.0        38.3
read03  36      38.9        39.4
read04  36      41.7        30.0
read05  36      61.1        33.9
read06  36      47.2        40.0
read07  36      52.8        12.2
read08  36      8.3         20.0
read09  22      31.8        40.0
read10  36      66.7        30.0
```

Two reads look bad. `read07` has a low mean quality (12.2) and three `N` bases. `read09` is short (22 bases). `read08` has a GC content of only 8.3%. Keep an eye on `read08`.

### 11.2 Remove bad reads

Keep reads with a length of at least 30 and a mean quality of at least 20. Save their IDs, and pull those reads out of the file with `seqtk`:

```bash
./scripts/fastq_qc.sh data/reads.fastq \
  | awk -F'\t' 'NR>1 && $2>=30 && $4>=20 {print $1}' > results/keep_ids.txt
wc -l < results/keep_ids.txt
seqtk subseq data/reads.fastq results/keep_ids.txt > results/clean.fastq
grep -c '^@read' results/clean.fastq
```

```text
8
8
```

Eight reads remain. `read07` and `read09` are gone.

### 11.3 Map the reads

The next script does five jobs. It indexes the reference. It maps the reads with `bwa mem`. It sorts and indexes the result with `samtools`. It writes the statistics. The log file records each step.

```bash
cat > scripts/map_reads.sh <<'EOF'
#!/usr/bin/env bash
# Map reads to a reference and write basic statistics.
# Usage: scripts/map_reads.sh ref.fa reads.fastq outdir
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 ref.fa reads.fastq outdir" >&2
  exit 1
fi

ref="$1"
reads="$2"
outdir="$3"
sample=$(basename "$reads" .fastq)

mkdir -p "$outdir"
log="$outdir/$sample.log"

echo "[$(date '+%F %T')] start $sample" | tee "$log"

bwa index "$ref" 2>> "$log"
bwa mem -t 2 "$ref" "$reads" 2>> "$log" \
  | samtools sort -o "$outdir/$sample.sorted.bam" -
samtools index "$outdir/$sample.sorted.bam"
samtools flagstat "$outdir/$sample.sorted.bam" > "$outdir/$sample.flagstat.txt"

echo "[$(date '+%F %T')] done $sample" | tee -a "$log"
EOF
chmod +x scripts/map_reads.sh
```

<!-- nocompare -->
```bash
./scripts/map_reads.sh data/ref.fa results/clean.fastq results/map
```

```text
[2026-10-12 14:06:59] start clean
[2026-10-12 14:06:59] done clean
```

The `\` at the end of a line means "the command continues on the next line".

### 11.4 Read the result

```bash
head -n 7 results/map/clean.flagstat.txt
```

```text
8 + 0 in total (QC-passed reads + QC-failed reads)
8 + 0 primary
0 + 0 secondary
0 + 0 supplementary
0 + 0 duplicates
0 + 0 primary duplicates
7 + 0 mapped (87.50% : N/A)
```

Seven of eight reads mapped. Look at where each read went. The first six columns of the SAM format are:

| Column | Meaning |
|---|---|
| 1 | Read name |
| 2 | Flag (`0` forward strand, `16` reverse strand, `4` not mapped) |
| 3 | Reference name |
| 4 | Position of the first base (counted from 1) |
| 5 | Mapping quality |
| 6 | CIGAR string (`36M` means 36 bases align) |

Print these columns:

```bash
samtools view results/map/clean.sorted.bam | cut -f 1-6
```

```text
read01	0	demo_ref	1	60	36M
read02	0	demo_ref	31	60	36M
read03	0	demo_ref	71	60	36M
read04	16	demo_ref	111	60	36M
read05	0	demo_ref	151	60	36M
read10	0	demo_ref	171	60	36M
read06	0	demo_ref	201	60	36M
read08	4	*	0	0	*
```

We made `read04` as a reverse complement, and `bwa` found it. Its flag is `16`. The read `read03` has one wrong base. It still shows `36M`, because a mismatch is not a gap.

The last line is a read that did not map. Its flag is `4`, and its position is `0`. Count the unmapped reads, and list them:

```bash
samtools view -c -f 4 results/map/clean.sorted.bam
samtools view -f 4 results/map/clean.sorted.bam | cut -f 1,2
```

```text
1
read08	4
```

The read `read08` is the poly-A read. Its mean quality is 20, so it passed the quality filter. But it does not come from the reference.

> **Field note.** A good quality score does not prove that a read is real. Quality filters and mapping answer different questions. In real projects, tools such as FastQC, fastp, and MultiQC do the work that you did here by hand. Now you know what they do inside.

---

## 12. When something goes wrong

You are not the first person to see an error. Read the message from the start. It often tells you the file name, the line, and the cause.

| Message | Likely cause | What to do |
|---|---|---|
| `command not found` | The program is not installed, the name is wrong, or it is not in `PATH`. | Check the spelling. Run `which name`. Activate the right conda environment. |
| `No such file or directory` | Wrong path, or wrong current directory. | Run `pwd` and `ls`. Use Tab to complete names. |
| `Permission denied` | You have no right to read, write, or run it. | Run `ls -l`. Use `chmod +x` for scripts. Ask the owner for shared files. |
| `env: 'bash\r': No such file...` | The script has Windows line ends. | `tr -d '\r' < old.sh > new.sh` |
| `unbound variable` | `set -u` found a variable that you did not set. | Check the spelling of the variable. |
| `a: command not found` after `a = 1` | There are spaces around `=`. | Write `a=1`. |
| `No space left on device` | The disk is full. | `df -h`, then `du -sh * \| sort -h`. Remove files that you no longer need. |
| `Disk quota exceeded` | You used your allowed space. | Same as above. Ask your administrator for more space. |
| `Killed` | The system stopped your program, often because it used too much memory. | Ask for more memory. Use less data. |
| `Argument list too long` | A `*` matched too many files. | Use `find ... -print0 \| xargs -0 ...`. |
| `Connection timed out` | The network or the server is down. | Check your network and VPN. Try `ssh -v` for details. |

Two examples that you can try:

```bash
printf '#!/usr/bin/env bash\r\necho hi\r\n' > scripts/crlf.sh
chmod +x scripts/crlf.sh
./scripts/crlf.sh 2>&1 | head -n 1
file scripts/crlf.sh
```

Your first line can use other words or quote marks. Look for `bash\r` in it. The `file` command also shows `CRLF line terminators`.

<!-- nocompare -->
```text
/usr/bin/env: 'bash\r': No such file or directory
scripts/crlf.sh: Bourne-Again shell script, ASCII text executable, with CRLF line terminators
```

```bash
tr -d '\r' < scripts/crlf.sh > scripts/crlf_fixed.sh
chmod +x scripts/crlf_fixed.sh
./scripts/crlf_fixed.sh
```

```text
hi
```

**How to ask for help.** Send these four things to your colleague or to a forum:

1. The exact command that you typed.
2. The complete error message (copy and paste it, do not take a photo).
3. What you expected to happen.
4. What you already tried.

---

## 13. Safe habits

- [ ] Keep raw data in one directory. Remove the write permission (`chmod a-w`). Never edit raw data.
- [ ] Write results to a different directory from the input.
- [ ] Write every command that matters in a script. Keep the scripts.
- [ ] Run `ls` before `rm`. Use `echo` as a dry run when you use `*`.
- [ ] Never write to a file that you read in the same command.
- [ ] Check free disk space before a large job (`df -h`).
- [ ] Test every script on a small input first.
- [ ] Save the log of every long job.
- [ ] Record the version of each tool (`samtools --version`, `conda list`).
- [ ] Back up important files to a second place. Check that you can open the backup.

---

## 14. Cheat sheet

| Job | Command |
|---|---|
| Where am I? | `pwd` |
| List files | `ls -lh` |
| Go to a directory | `cd DIR`, `cd ~`, `cd ..`, `cd -` |
| Make a directory | `mkdir -p a/b` |
| Copy, move, delete | `cp -r`, `mv`, `rm` |
| Show a file | `head -n 5 f`, `tail -n 5 f`, `less f` |
| Count lines | `wc -l f` |
| Read a `.gz` file | `gzip -dc f.gz \| head` |
| Search text | `grep -n 'text' f` |
| Select columns | `cut -f 1,3 f` or `awk -F'\t' '{print $1,$3}' f` |
| Count values | `sort \| uniq -c \| sort -k1,1nr` |
| Replace text | `sed 's/old/new/g' f` |
| Find files | `find . -name "*.bam"` |
| Compress | `tar -czvf a.tar.gz dir/` |
| Unpack | `tar -xzvf a.tar.gz` |
| Download | `curl -L -O URL` or `wget URL` |
| Checksum | `sha256sum f` |
| Permissions | `chmod +x f`, `chmod 644 f` |
| Disk space | `df -h .`, `du -sh *` |
| Memory, CPU | `free -h`, `nproc`, `top` |
| Stop a command | `Ctrl+C` |
| Keep a job alive | `tmux new -s name`, `nohup cmd > log 2>&1 &` |
| Copy to a server | `rsync -avhP src/ lab:dir/` |
| Help | `man cmd`, `cmd --help` |

**Keyboard shortcuts.**

| Keys | Action |
|---|---|
| Tab | Complete a name. |
| Ctrl+C | Stop the running command. |
| Ctrl+R | Search the history of commands. |
| Ctrl+A / Ctrl+E | Go to the start / end of the line. |
| Ctrl+L | Clear the screen. |
| Ctrl+D | Leave the shell, or end the input. |
| Up arrow | The previous command. |
| `!!` | Repeat the last command. |

---

## 15. Learn more

**Free courses and books**

- [The Unix Shell (Software Carpentry)](https://swcarpentry.github.io/shell-novice/): a gentle course with exercises.
- [The Missing Semester of Your CS Education (MIT)](https://missing.csail.mit.edu/): shell, scripting, Vim, Git.
- [Rosalind](https://rosalind.info/): bioinformatics problems that you solve with code.
- [Bioconda](https://bioconda.github.io/): how to install bioinformatics tools with conda.
- [Slurm quick start](https://slurm.schedmd.com/quickstart.html): the official guide for job scheduling.
- [Snakemake](https://snakemake.readthedocs.io/) and [Nextflow](https://www.nextflow.io/): workflow managers.
- [tldr](https://tldr.sh/): short examples for common commands.
- *Bioinformatics Data Skills* by Vince Buffalo (O'Reilly): a book for the next step.
- *The Linux Command Line* by William Shotts: a free book (linuxcommand.org).
- *鸟哥的 Linux 私房菜*: a classic Linux book in Chinese. Use it as a reference. You do not need to read it from start to end.
- Biostars (biostars.org): a question-and-answer site for bioinformatics.

**Chinese-language reading on Zhihu.** These pages discuss the same topics as the field notes in this guide. We did not copy their text. Read them for more detail:

- [生物信息学100个基础问题 —— 番外1： 不学Linux做什么生信？](https://zhuanlan.zhihu.com/p/34935771)
- [生信自学之linux操作基础](https://zhuanlan.zhihu.com/p/24863136)
- [如何让任务永不掉线：tmux](https://zhuanlan.zhihu.com/p/426157381)
- [Tmux 一款好用终端复用器（代替nohup！）](https://zhuanlan.zhihu.com/p/667515002)
- [【精】Bioconda 生信环境配置生存指南](https://zhuanlan.zhihu.com/p/46029431)
- [一文掌握Conda软件安装：虚拟环境、软件通道、加速solving、跨服务器迁移](https://zhuanlan.zhihu.com/p/462158923)
- [不小心敲了 rm -rf / 后反应是怎样的？](https://www.zhihu.com/question/29438735)

**About the writing style.** The rules of ASD-STE100 are at [asd-ste100.org](https://asd-ste100.org/).

---

[↑ Back to top](#en) · [跳到中文版 →](#zh)

---

<a id="zh"></a>

# 生物信息学 Linux 入门

**给初学者的动手教程** · 中文版 · [English version ↑](#en)

---

## 关于这份教程

**适合谁。** 你在处理测序数据，或者很快会处理。你没用过命令行，或者只用过一点。

**你会做什么。** 你会建一个小实验目录。你会查看 FASTQ 文件，数 reads，再过滤 reads。然后你用 `bwa` 和 `samtools` 把 reads 比对到参考序列。最后你会写一个脚本，并在服务器上运行长任务。

**怎么使用。**

1. 打开终端（第 2 章）。
2. 按顺序输入每条命令。第 2 章和第 3 章生成的文件，后面的章节会用到。
3. 把你的输出和教程里的输出对比。
4. 做短练习。答案折叠在每个练习下面。

**教程里的符号。**

| 符号 | 含义 |
|---|---|
| 代码块 | 你要输入的命令。不要输入 `#` 后面的注释。 |
| 灰色 `text` 块 | 你会看到的输出。你的用户名、日期和路径会不同。`Mon DD HH:MM` 代表你电脑上的日期和时间。 |
| **注意** | 补充信息。 |
| **小心** | 这里出错会毁掉数据，或者浪费几个小时。 |
| **经验谈** | 来自实际使用的建议，也包括知乎中文教程里出现过的建议。 |

**测试情况。** 我们在干净的 Ubuntu 24.04 账号里，运行了第 2 章到第 12 章的命令。工具版本：bash 5.2、mawk 1.3.4、seqtk 1.4、samtools 1.19.2、bwa 0.7.17。需要真实服务器的命令我们没有运行：`ssh`、`scp`、Slurm、`tmux` 界面和 `top`。这些代码块只展示标准写法。

**写作风格。** 英文部分遵循 ASD-STE100（简化技术英语）的主要规则：句子短，一句话只有一个意思，用主动语态，一个词只表示一件事。我们没有用官方 STE 词典逐词检查，所以英文部分是“STE 风格”，不是“STE 认证”。STE 是英文写作标准，中文没有对应的标准。中文部分沿用同样的做法：短句，一句一事，用词统一。

**本教程用到的词。**

| 词 | 含义 |
|---|---|
| 终端 | 你输入命令的窗口。 |
| Shell | 终端里读取你的命令的程序。Bash 和 zsh 都是 Shell。 |
| 命令 | 你在 Shell 里启动的程序。例如 `ls`。 |
| 选项 | 命令后面的字母，用来改变命令的工作方式。例如 `-l`。 |
| 参数 | 命令要处理的对象。例如一个文件名。 |
| 目录 | 文件夹。 |
| 路径 | 文件或目录的地址。例如 `/home/alice/data`。 |
| 提示符 | 光标前面的文字，常常以 `$` 结尾。不要输入它。 |

### 目录

1. [为什么生物信息学用 Linux](#z1)
2. [获得一个 Linux Shell](#z2)
3. [在目录间移动，管理文件](#z3)
4. [查看文件内容](#z4)
5. [管道和重定向](#z5)
6. [处理序列文件和表格文件的文本工具](#z6)
7. [权限](#z7)
8. [安装软件，配置环境](#z8)
9. [在远程服务器上工作](#z9)
10. [写一个 Shell 脚本](#z10)
11. [小项目：检查 reads 质量并比对](#z11)
12. [出错了怎么办](#z12)
13. [安全习惯](#z13)
14. [速查表](#z14)
15. [继续学习](#z15)

---

<a id="z1"></a>

## 1. 为什么生物信息学用 Linux

**开发者主要为 Linux 写工具。** BWA、samtools、STAR 和 GATK 这样的程序，能在 Linux 和 macOS 上运行。其中很多程序不能直接在 Windows 上运行。Windows 用户通过 WSL 运行它们（第 2 章）。

**服务器运行 Linux。** 你们实验室的计算服务器或集群，几乎都运行 Linux。你用终端连接它。你必须懂基本命令，才能在那里工作。

**文件又多又大。** 一次测序会产生很多文件。每个文件可能有几百万行。你不能用鼠标逐个打开文件。一条命令可以处理 100 个文件。

**命令是一份记录。** 你可以把命令保存在文本文件里。下个月你可以再运行同一个文件。同事也可以运行它。这让你的工作可以重复。

> **经验谈：你不需要学完整个 Linux。**
>
> 知乎上有几篇教程给出同样的建议。不要先读完一整本 Linux 书。学下面这一小套技能就够了：
>
> - 在目录之间移动。
> - 复制和删除文件。
> - 用 `grep`、`awk` 和 `sed` 搜索、编辑文本。
> - 安装软件。
> - 理解路径。
>
> 其余的，用到再学。本教程就按这个建议来写。

---

<a id="z2"></a>

## 2. 获得一个 Linux Shell

### 2.1 选择你的系统

| 你的电脑 | 怎么做 |
|---|---|
| Windows 10 或 11 | 安装带 Ubuntu 的 WSL2。以管理员身份打开 PowerShell，运行 `wsl --install`，然后重启。再打开“Ubuntu”应用。 |
| macOS | 打开“终端”（Terminal）应用。阅读下面的注意事项。 |
| Linux | 打开一个终端。 |
| 远程服务器 | 用 `ssh` 连接（第 9 章）。 |

> **WSL 用户注意。** 你的 Windows 磁盘在 `/mnt/c`、`/mnt/d` 等位置。请在 Linux 的家目录（`~`）里工作。在 `/mnt/c` 上工作要慢得多。

> **macOS 用户注意。** 默认 Shell 是 zsh，不是 bash。本教程里大多数命令的效果相同。macOS 用某些工具的 BSD 版本，少数选项不一样。这种地方，教程会告诉你。你可以用 `brew install coreutils gawk gnu-sed` 安装 GNU 版本。

> **经验谈：先在自己的电脑上练习。**
>
> 知乎上有些入门教程给出同样的建议。先用 WSL 或虚拟机练习，再去碰共享服务器。在自己的电脑上出错，不花任何代价。在共享服务器上出错，可能连累整个实验室。

### 2.2 安装本教程用的工具

在 Ubuntu 或 WSL 上：

<!-- notest -->
```bash
sudo apt update
sudo apt install -y seqtk samtools bwa
```

在 macOS 上（用 Homebrew）：

<!-- notest -->
```bash
brew install seqtk samtools bwa
```

在共享服务器上，你不能用 `sudo`。请改用 conda（第 8 章）。

### 2.3 你的第一批命令

输入下面的命令，然后按 Enter：

```bash
echo "Hello, Linux"
```

```text
Hello, Linux
```

`echo` 打印文字。引号里的词是参数。

再用两条命令看看你是谁、你在哪里：

```bash
whoami
pwd
```

```text
alice
/home/alice
```

`whoami` 打印你的用户名。`pwd` 打印你现在所在的目录。你的输出会不同。

看一条命令的各个部分：

```
ls   -l   data
│    │    └── 参数：要处理什么
│    └─────── 选项：怎么处理
└──────────── 命令：运行什么
```

---

<a id="z3"></a>

## 3. 在目录间移动，管理文件

### 3.1 建立实验目录

运行下一个代码块。它会建一个实验目录，里面有三个小文件。所有数据都是编造的，只用于学习。

- `reads.fastq` 有 10 条短 reads。
- `ref.fa` 是一条 240 个碱基的参考序列。除了一条以外，所有 reads 都来自它。
- `genes.tsv` 是一张表，有 10 个编造的基因。

`cat > file <<'EOF'` 这个写法，会把直到 `EOF` 的所有行写进文件。`tr` 那一行把空格换成制表符。你会在第 6 章学到 `tr`。

```bash
mkdir -p ~/linux-lab/{data,results,scripts}
cd ~/linux-lab

cat > data/reads.fastq <<'EOF'
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@read02
GCACGAAACTTGTTGGCCCAGTGTGAATCGCTTAAG
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIII??????
@read03
AAGTAAGTGTAATGCATACGCCTTTACTTGCTGTGT
+
IIIIIIIIII5IIIIIIIIIIIIIIIIIIIIIIIII
@read04
TGTTTCTGAGTGTAATAAAAATGCCAGTCCGATGGG
+
????????????????????????????????????
@read05
TCGGGTAATTTTGACAGGTCACGCAGAGGCGCGCCC
+
IIIIIIIIIIIIIIIIIIII??????????555555
@read06
GACACTCGCTATGAATCTCTGATTTACCCACTCTGC
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
@read07
CCTTNNNTTGCTGTGTCCACCCCATCGGACTGGCAT
+
IIII###555555555555#################
@read08
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACGTAC
+
555555555555555555555555555555555555
@read09
TGGCATTTTTATTACACTCAGA
+
IIIIIIIIIIIIIIIIIIIIII
@read10
ACGCAGAGGCGCGCCCTCCTGAAGTGCGTGGACACT
+
????????????????????????????????????
EOF

cat > data/ref.fa <<'EOF'
>demo_ref length=240
GCTAAAGACAATTACATAACATACACGTCAGCACGAAACTTGTTGGCCCAGTGTGAATCG
CTTAAGGGTTAAGTAAGTGTGATGCATACGCCTTTACTTGCTGTGTCCACCCCATCGGAC
TGGCATTTTTATTACACTCAGAAACAGAACTCGGGTAATTTTGACAGGTCACGCAGAGGC
GCGCCCTCCTGAAGTGCGTGGACACTCGCTATGAATCTCTGATTTACCCACTCTGCCAAA
EOF

cat > data/genes.txt <<'EOF'
gene_id chrom start end strand biotype tpm
GENE001 chr1 1200 5400 + protein_coding 35.2
GENE002 chr1 8800 9900 - lncRNA 1.4
GENE003 chr1 15000 22000 + protein_coding 120.8
GENE004 chr2 500 3200 - protein_coding 8.9
GENE005 chr2 7000 7600 + miRNA 0.3
GENE006 chr2 12000 18500 + protein_coding 56.0
GENE007 chr3 2000 2900 - lncRNA 4.7
GENE008 chr3 9000 14000 + protein_coding 0.0
GENE009 chrX 300 4300 - protein_coding 77.5
GENE010 chrX 6000 6400 + miRNA 2.1
EOF
tr -s ' ' '\t' < data/genes.txt > data/genes.tsv
rm data/genes.txt
```

检查结果：

```bash
ls -l data
```

```text
total 12
-rw-r--r-- 1 alice alice 457 Mon DD HH:MM genes.tsv
-rw-r--r-- 1 alice alice 812 Mon DD HH:MM reads.fastq
-rw-r--r-- 1 alice alice 265 Mon DD HH:MM ref.fa
```

如果文件大小（457、812、265）和你的一样，文件就是对的。

### 3.2 我在哪里？

三条命令告诉你，你在哪里，那里有什么：

| 命令 | 作用 |
|---|---|
| `pwd` | 打印当前目录的路径。 |
| `ls` | 列出当前目录里的文件。 |
| `cd DIR` | 进入目录 `DIR`。 |

```bash
pwd
ls
```

```text
/home/alice/linux-lab
data  results  scripts
```

*路径*告诉 Shell 文件在哪里。路径有两种：

- **绝对路径**以 `/` 开头。例如 `/home/alice/linux-lab/data`。在任何位置都有效。
- **相对路径**不以 `/` 开头。例如 `data/ref.fa`。它从你当前所在的目录开始算。

四个短名字很有用：

| 名字 | 含义 |
|---|---|
| `~` | 你的家目录。 |
| `.` | 当前目录。 |
| `..` | 上一级目录（往上一层）。 |
| `-` | 配合 `cd` 使用：你上一次所在的目录。 |

```bash
cd data
pwd
ls ..
cd ..
pwd
```

```text
/home/alice/linux-lab/data
data  results  scripts
/home/alice/linux-lab
```

隐藏文件以点开头。用 `ls -a` 查看它们：

```bash
ls -a ~
```

```text
.  ..  linux-lab
```

> **小技巧：用 Tab 键。** 输入名字的前几个字母，然后按 Tab。Shell 会补全名字。按两次 Tab 可以看到所有选择。这样省时间，也能避免输错。

### 3.3 新建、复制、移动和删除

| 命令 | 作用 | 例子 |
|---|---|---|
| `mkdir -p` | 新建目录（连同上级目录）。 | `mkdir -p results/qc` |
| `cp` | 复制文件。复制目录要加 `-r`。 | `cp a.txt b.txt` |
| `mv` | 移动或重命名文件。 | `mv a.txt c.txt` |
| `rm` | 删除文件。删除目录要加 `-r`。 | `rm c.txt` |
| `touch` | 新建空文件。 | `touch notes.txt` |

```bash
cp data/reads.fastq results/reads_copy.fastq
mv results/reads_copy.fastq results/reads_backup.fastq
ls results
```

```text
reads_backup.fastq
```

```bash
rm results/reads_backup.fastq
ls results
```

最后一个 `ls` 什么也不打印，因为 `results` 现在是空的。

星号 `*` 代表任意文字。在命令运行**之前**，Shell 就把 `*.tmp` 换成所有匹配的文件名。用这一点可以安全地测试删除命令。在命令前面加 `echo`：

```bash
touch results/a.tmp results/b.tmp
ls results/*.tmp
echo rm results/*.tmp
rm results/*.tmp
```

```text
results/a.tmp  results/b.tmp
rm results/a.tmp results/b.tmp
```

`echo` 只是打印命令。它告诉你 `rm` 将要删除哪些文件。

> **小心：Linux 没有回收站。** `rm` 会立刻删除文件，你无法把它们找回来。在很多服务器上，没有人替你的文件做备份。
>
> 遵守这些规则：
> 1. 先用同样的匹配模式运行 `ls`，看一遍清单。
> 2. 用到 `*` 时，在 `rm` 前面加 `echo`。
> 3. 不确定就不要用 `rm -f`。它会隐藏所有警告。
> 4. 当 `$DIR` 可能为空时，绝不要运行 `rm -rf "$DIR"/*`。空变量会把命令变成 `rm -rf /*`。

> **经验谈：多数删库事故都是小失误。**
>
> 知乎上关于 `rm -rf` 事故的帖子，常常把多打一个空格或路径没写完整当作原因。当前目录不对或变量为空，也会造成同样的破坏。
>
> 按下 Enter 后，如果你看到不对的结果，立刻按 Ctrl+C。然后停止向那块磁盘写入。在试其他办法之前，先问你的管理员。恢复工具是有的，但常常失败。只有备份才是可靠的办法。

### 3.4 好的文件名

文件名里只用字母、数字、`_`、`-` 和 `.`。不要用空格。空格会把一个名字拆成两个参数：

```bash
cd results
touch "my file.txt"
rm my file.txt
```

```text
rm: cannot remove 'my': No such file or directory
rm: cannot remove 'file.txt': No such file or directory
```

Shell 把 `my` 和 `file.txt` 当成两个文件。用引号可以解决，之后请换一个更好的名字：

```bash
rm "my file.txt"
cd ..
```

### 3.5 编辑文本文件

小改动用 `nano`。它在屏幕底部显示按键提示。符号 `^` 代表 Ctrl 键。

<!-- notest -->
```bash
nano notes.txt
```

| 按键 | 动作 |
|---|---|
| Ctrl+O，然后 Enter | 保存文件。 |
| Ctrl+X | 退出 nano。 |
| Ctrl+W | 搜索。 |

有时你会遇到 `vim`，例如 Git 或 `crontab` 打开了它。你只需要四步就能脱身：

1. 按 `i` 开始输入。
2. 输入你的文字。
3. 按 `Esc` 停止输入。
4. 输入 `:wq` 然后按 Enter，保存并退出。输入 `:q!` 然后按 Enter，不保存直接退出。

> **经验谈。** “怎么退出 Vim？”是程序员圈里一个有名的玩笑。现在你知道答案了。

### 3.6 文件系统地图

一切都从 `/`（根目录）开始。这些位置最重要：

| 路径 | 里面有什么 |
|---|---|
| `/home/alice` | 你的家目录（也写作 `~`）。你的文件放在这里。 |
| `/tmp` | 临时文件。系统随时可能删除它们。 |
| `/etc` | 系统设置。 |
| `/usr/bin` | 大多数程序。 |
| `/mnt/c` | Windows 的 `C:` 盘（仅限 WSL）。 |

> **经验谈：在集群上，你的家目录往往很小。**
>
> 把大数据放在项目盘或 scratch 盘上。各个机构的名字不同（`/data`、`/scratch`、`/project`）。请问你的管理员。有些集群会自动删除 scratch 盘上的旧文件。请阅读你所在机构的规则。

### 3.7 获取帮助

你不需要记住每个选项。可以随时查：

<!-- notest -->
```bash
ls --help        # 简短帮助
man ls           # 完整手册。按 q 退出。
type cd          # 显示这是哪一类命令
which samtools   # 显示程序在哪里
```

如果你看不懂一条错误信息，就把它复制到搜索引擎里。在你之前，已经有很多人遇到过它。

---

<a id="z4"></a>

## 4. 查看文件内容

### 4.1 FASTQ 文件长什么样

FASTQ 文件保存测序 reads。每条 read 占四行：

```
@read01                                  第 1 行：read 名字（以 @ 开头）
GCTAAAGACAATTACATAACATACACGTCAGCACGA    第 2 行：碱基
+                                        第 3 行：分隔符
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII    第 4 行：质量值，每个碱基对应一个字符
```

每个质量字符代表一个数字。这个数字是该字符的 ASCII 码减去 33。它就是 Phred 分数 **Q**。Q 越高，出错的概率越低。

| 字符 | Q | 这个碱基出错的概率 |
|---|---|---|
| `I` | 40 | 万分之一 |
| `?` | 30 | 千分之一 |
| `5` | 20 | 百分之一 |
| `#` | 2 | 约五分之三 |

### 4.2 显示开头、结尾和大小

```bash
head -n 4 data/reads.fastq
```

```text
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
+
IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII
```

```bash
tail -n 4 data/reads.fastq
wc -l data/reads.fastq
```

```text
@read10
ACGCAGAGGCGCGCCCTCCTGAAGTGCGTGGACACT
+
????????????????????????????????????
40 data/reads.fastq
```

`head` 显示前几行。`tail` 显示最后几行。`wc -l` 数行数。这个文件有 40 行。每条 read 占 4 行，所以文件有 10 条 reads。

### 4.3 用 `less` 读长文件

<!-- notest -->
```bash
less data/reads.fastq
```

长文件用 `less` 读。它一次显示一屏。

| 按键 | 动作 |
|---|---|
| 空格 | 下一页。 |
| `b` | 上一页。 |
| `/ACGT` 然后 Enter | 搜索 ACGT。 |
| `q` | 退出。 |

用 `less -S` 可以让长行不换行。

> **经验谈。** 永远不要用文本编辑器打开 30 GB 的 FASTQ 文件。电脑会卡死。`less` 只读取屏幕上能看到的部分。`cat` 会打印整个文件，所以只对小文件使用它。

### 4.4 压缩文件

大多数测序文件以 `.gz` 结尾。这些文件占用的空间更小。不要解压它们。用 `gzip -dc` 读，它会打印解压后的文本：

```bash
gzip -c data/reads.fastq > results/reads.fastq.gz
ls -l results
gzip -dc results/reads.fastq.gz | head -n 2
```

```text
total 4
-rw-r--r-- 1 alice alice 269 Mon DD HH:MM reads.fastq.gz
@read01
GCTAAAGACAATTACATAACATACACGTCAGCACGA
```

这里 `gzip -c` 把结果输出到屏幕。`>` 符号把这些文字送进一个新文件。你会在第 5 章学到更多关于 `>` 的内容。

> **注意。** 在 Linux 上你也可以用 `zcat` 或 `zless`。在 macOS 上，`zcat` 期望的是别的文件类型，所以那里请用 `gzip -dc`。

### 4.5 磁盘空间

大数据会把磁盘塞满。经常检查空间：

<!-- nocompare -->
```bash
df -h .
du -sh data
```

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda        252G  9.1G   30G  24% /
16K	data
```

`df -h .` 显示当前目录所在磁盘的剩余空间。`du -sh data` 显示目录 `data` 占用多少空间。

### 4.6 用列显示表格

```bash
column -t data/genes.tsv | head -n 4
```

```text
gene_id  chrom  start  end    strand  biotype         tpm
GENE001  chr1   1200   5400   +       protein_coding  35.2
GENE002  chr1   8800   9900   -       lncRNA          1.4
GENE003  chr1   15000  22000  +       protein_coding  120.8
```

`column -t` 把各列对齐。文件本身不会改变。

---

<a id="z5"></a>

## 5. 管道和重定向

这一章是理解后面所有内容的关键。每个 Linux 命令只做一件小事。管道和重定向把这些命令连起来。

### 5.1 三条数据流

每个命令都有三条数据流：

| 数据流 | 编号 | 默认位置 |
|---|---|---|
| 标准输入（stdin） | 0 | 键盘 |
| 标准输出（stdout） | 1 | 屏幕 |
| 标准错误（stderr） | 2 | 屏幕 |

### 5.2 重定向到文件

| 符号 | 动作 |
|---|---|
| `>` | 把输出写入文件。**它会替换旧内容。** |
| `>>` | 把输出添加到文件末尾。 |
| `<` | 从文件读取输入。 |
| `2>` | 把错误信息写入文件。 |
| `2>&1` | 把错误送到和正常输出相同的地方。 |

```bash
echo "hello" > results/note.txt
echo "world" >> results/note.txt
cat results/note.txt
```

```text
hello
world
```

```bash
ls data/missing.txt 2> results/err.txt
echo "exit code: $?"
cat results/err.txt
```

```text
exit code: 2
ls: cannot access 'data/missing.txt': No such file or directory
```

每个命令都会返回一个*退出码*。零表示成功。其他数字表示出错。变量 `$?` 保存上一条命令的退出码。

> **小心：绝不要写入你正在读的文件。** 在命令开始**之前**，Shell 就打开并清空了输出文件。命令读到的是一个空文件。所有数据都没了。下面的演示用的是副本，你的数据是安全的。

```bash
cp data/genes.tsv results/test.tsv
sort results/test.tsv > results/test.tsv
wc -c < results/test.tsv
```

```text
0
```

现在这个文件是 0 字节。请改写到一个新文件：`sort a.tsv > a.sorted.tsv`。

### 5.3 用管道连接命令

管道符号 `|` 把一个命令的输出送给下一个命令。用五步统计 `genes.tsv` 里的基因类型：

| 步骤 | 命令 | 结果 |
|---|---|---|
| 1 | `cut -f 6 data/genes.tsv` | 第 6 列（类型）。 |
| 2 | `\| tail -n +2` | 去掉标题行。 |
| 3 | `\| sort` | 把相同的类型排在一起。 |
| 4 | `\| uniq -c` | 数相同的行。 |
| 5 | `\| sort -k1,1nr` | 按数量排序，大的在前。 |

```bash
cut -f 6 data/genes.tsv | tail -n +2 | sort | uniq -c | sort -k1,1nr
```

```text
      6 protein_coding
      2 lncRNA
      2 miRNA
```

长管道要一步一步地搭。先运行第一个命令。再加一个命令。看输出。重复这个过程。

> **经验谈。** 在我们看来，管道是本教程里最有用的想法。学会它之后，很多小的数据任务一行命令就能解决。你不需要 Excel，也不需要写新脚本。

### 5.4 按顺序运行命令

| 符号 | 含义 |
|---|---|
| `a ; b` | 运行 `a`，然后运行 `b`。 |
| `a && b` | 只有 `a` 成功，才运行 `b`。 |
| `a \|\| b` | 只有 `a` 失败，才运行 `b`。 |

```bash
ls data/ref.fa && echo "found"
ls data/none.fa 2> /dev/null || echo "missing"
```

```text
data/ref.fa
found
missing
```

`/dev/null` 是一个特殊文件，写进去的东西都会被丢弃。用它隐藏你不需要的信息。

### 5.5 变量、引号和命令替换

```bash
name="read01"
echo "id: $name"
echo 'id: $name'
echo "reads: $(grep -c '^@read' data/reads.fastq)"
```

```text
id: read01
id: $name
reads: 10
```

- 设置变量时，`=` 两边不要有空格。
- 双引号 `"..."` 会替换变量。单引号 `'...'` 不会。
- `$(command)` 会运行命令，并用它的输出代替 `$(command)`。
- 使用变量时，总是写成 `"$name"`，带上引号。这样带空格的名字仍然是一个整体。

### 5.6 练习

**练习 5.1。** 每条染色体上有多少个基因？

<details>
<summary>答案</summary>

```bash
cut -f 2 data/genes.tsv | tail -n +2 | sort | uniq -c
```

```text
      3 chr1
      3 chr2
      2 chr3
      2 chrX
```

</details>

---

<a id="z6"></a>

## 6. 处理序列文件和表格文件的文本工具

大多数生物信息学文件都是纯文本。这些工具对它们都有效。

| 工具 | 主要工作 |
|---|---|
| `grep` | 找出匹配某个模式的行。 |
| `cut` | 切出若干列。 |
| `sort`、`uniq` | 给行排序，数相同的行。 |
| `tr` | 替换或删除单个字符。 |
| `awk` | 处理列、条件和求和。 |
| `sed` | 替换文字，选择行。 |
| `find`、`xargs` | 查找文件，并对它们运行命令。 |

### 6.1 `grep`：找行

| 选项 | 含义 |
|---|---|
| `-c` | 数匹配的行数。 |
| `-n` | 显示行号。 |
| `-v` | 显示**不**匹配的行。 |
| `-i` | 忽略大小写。 |
| `-A 2`、`-B 1` | 同时显示每个匹配之后 2 行，或之前 1 行。 |
| `-E` | 使用扩展模式（`a\|b`）。 |

在模式里，`^` 表示“行的开头”。

```bash
grep -c '^@read' data/reads.fastq
grep -n '^@read' data/reads.fastq | head -n 3
grep -B1 -A2 'NNN' data/reads.fastq
```

```text
10
1:@read01
5:@read02
9:@read03
@read07
CCTTNNNTTGCTGTGTCCACCCCATCGGACTGGCAT
+
IIII###555555555555#################
```

> **小心。** 第一条命令在这里能用，只是因为所有 read 名字都以 `@read` 开头。在真实数据里，质量行也可能以 `@` 开头。要数 FASTQ 文件的 reads 数，请用总行数除以 4。

### 6.2 `cut`、`sort`、`uniq`

`cut -f` 选择用制表符分隔的列。对用逗号分隔的文件，加上 `-d,`。

```bash
cut -f 1,7 data/genes.tsv | head -n 3
sort -t$'\t' -k7,7nr data/genes.tsv | head -n 4 | cut -f 1,7
```

```text
gene_id	tpm
GENE001	35.2
GENE002	1.4
GENE003	120.8
GENE009	77.5
GENE006	56.0
GENE001	35.2
```

在 `sort` 里，`-t` 设置列分隔符，`-k7,7` 选择第 7 列，`n` 表示“数字”，`r` 表示“反向”。

### 6.3 `tr`：替换字符

求 DNA 序列的反向互补，是很常见的任务。`rev` 把文字反过来。`tr` 把每个碱基换成它的配对碱基：

```bash
echo ACGTNacgt | rev | tr ACGTacgt TGCAtgca
```

```text
acgtNACGT
```

你也可以删除字符。下面的命令数参考序列的碱基数，不计标题行和换行符：

```bash
grep -v '^>' data/ref.fa | tr -d '\n' | wc -c
```

```text
240
```

### 6.4 `awk`：处理列

`awk` 逐行读取文件。它把每一行拆成字段，叫 `$1`、`$2`，依此类推。`$0` 是整行。一个程序的形式是 `条件 { 动作 }`。

| 部分 | 含义 |
|---|---|
| `-F'\t'` | 字段用制表符分隔。 |
| `NR` | 当前行的行号。 |
| `NF` | 这一行的字段数。 |
| `BEGIN { ... }` | 在第一行之前运行。 |
| `END { ... }` | 在最后一行之后运行。 |

选择行和列：

```bash
awk -F'\t' 'NR>1 && $6=="protein_coding" {print $1, $7}' data/genes.tsv
```

```text
GENE001 35.2
GENE003 120.8
GENE004 8.9
GENE006 56.0
GENE008 0.0
GENE009 77.5
```

计算平均值，并计算每个基因的长度：

```bash
awk -F'\t' 'NR>1 {sum+=$7} END {print "mean TPM:", sum/(NR-1)}' data/genes.tsv
awk -F'\t' 'BEGIN{OFS="\t"} NR>1 {print $1, $4-$3+1}' data/genes.tsv | head -n 3
```

```text
mean TPM: 30.69
GENE001	4201
GENE002	1101
GENE003	7001
```

用数组按值统计行数：

```bash
awk -F'\t' 'NR>1 {n[$6]++} END {for (k in n) print k, n[k]}' data/genes.tsv | sort
```

```text
lncRNA 2
miRNA 2
protein_coding 6
```

FASTQ 文件里每条 read 有 4 行。行号除以 4 的余数，告诉你这一行是什么类型。下面的命令打印每条序列的长度，然后统计每种长度出现的次数：

```bash
awk 'NR%4==2 {print length($0)}' data/reads.fastq | sort -n | uniq -c
```

```text
      1 22
      9 36
```

> **经验谈。** `awk` 第一天看起来很难。先只学三样：用 `-F` 指定分隔符，用 `$N` 表示某一列，在花括号前面写一个条件。这三样能应付大多数日常工作。

### 6.5 `sed`：替换和选择

```bash
sed '1!s/chr//' data/genes.tsv | cut -f 2 | head -n 3
sed -n '2,3p' data/genes.tsv | cut -f 1-3
sed '1d' data/genes.tsv | head -n 2 | cut -f 1
```

```text
chrom
1
1
GENE001	chr1	1200
GENE002	chr1	8800
GENE001
GENE002
```

- `s/old/new/` 替换每行里的第一个 `old`。加上 `g` 可以替换所有。
- `1!` 的意思是“对除第 1 行以外的所有行”。我们用它保留了标题行。
- `-n '2,3p'` 只打印第 2 到第 3 行。
- `1d` 删除第 1 行。

> **小心：`sed -i` 在 macOS 上不一样。** `sed -i` 直接修改文件。在 Linux 上写 `sed -i 's/a/b/' file`。在 macOS 上写 `sed -i '' 's/a/b/' file`。为了稳妥，请写到一个新文件里，然后再重命名。

### 6.6 `find` 和 `xargs`

```bash
find data -name "*.fa" -o -name "*.tsv" | sort
find data -name "*.fastq" -print0 | xargs -0 ls -l
```

```text
data/genes.tsv
data/ref.fa
-rw-r--r-- 1 alice alice 812 Mon DD HH:MM data/reads.fastq
```

`find` 按名字、大小或时间查找文件。`xargs` 接收这些文件名，并对它们运行命令。选项 `-print0` 和 `-0` 能让带空格的名字保持安全。

### 6.7 练习

**练习 6.1。** 把 TPM 大于 50 的基因 ID 保存到文件 `results/high_tpm.txt`。

<details>
<summary>答案</summary>

```bash
awk -F'\t' 'NR>1 && $7>50 {print $1}' data/genes.tsv > results/high_tpm.txt
cat results/high_tpm.txt
```

```text
GENE003
GENE006
GENE009
```

</details>

**练习 6.2。** 哪些 reads 少于 30 个碱基？

<details>
<summary>答案</summary>

```bash
awk 'NR%4==1 {id=$1} NR%4==2 && length($0)<30 {print id, length($0)}' data/reads.fastq
```

```text
@read09 22
```

</details>

**练习 6.3。** 求 `GATTACA` 的反向互补序列。

<details>
<summary>答案</summary>

```bash
echo GATTACA | rev | tr ACGT TGCA
```

```text
TGTAATC
```

</details>

---

<a id="z7"></a>

## 7. 权限

### 7.1 读懂权限字符串

每个文件都有所有者、所属组和一组权限。`ls -l` 会显示它们：

```bash
cat > scripts/hello.sh <<'EOF'
#!/usr/bin/env bash
echo "Hello from a script"
EOF
ls -l scripts/hello.sh
```

```text
-rw-r--r-- 1 alice alice 47 Mon DD HH:MM scripts/hello.sh
```

```
-  rw-  r--  r--   1   alice  alice   47   Mon DD HH:MM   scripts/hello.sh
│  │    │    │         │      │       │    │              └── 名字
│  │    │    │         │      │       │    └── 日期
│  │    │    │         │      │       └── 大小（字节）
│  │    │    │         │      └── 所属组
│  │    │    │         └── 所有者
│  │    │    └── 其他所有人的权限
│  │    └── 所属组的权限
│  └── 所有者的权限
└── 类型：- 是文件，d 是目录
```

三个字母是 `r`（读）、`w`（写）和 `x`（运行；对目录来说是进入）。

### 7.2 用 `chmod` 修改权限

新脚本不能运行，因为它没有 `x`：

```bash
./scripts/hello.sh
```

```text
bash: ./scripts/hello.sh: Permission denied
```

加上 `x` 权限：

```bash
chmod +x scripts/hello.sh
ls -l scripts/hello.sh
./scripts/hello.sh
```

```text
-rwxr-xr-x 1 alice alice 47 Mon DD HH:MM scripts/hello.sh
Hello from a script
```

你也可以用数字表示权限。读是 4，写是 2，运行是 1。为每一组把数字加起来：

| 数字 | 所有者 | 所属组 | 其他人 | 用途 |
|---|---|---|---|---|
| `644` | rw- | r-- | r-- | 普通文件 |
| `755` | rwx | r-x | r-x | 脚本、程序、目录 |
| `600` | rw- | --- | --- | 私钥 |
| `700` | rwx | --- | --- | 私有目录 |

目录需要 `x` 权限，否则谁也进不去。

### 7.3 保护你的原始数据

原始数据不能被改动。去掉写权限：

```bash
chmod a-w data/reads.fastq
echo "oops" >> data/reads.fastq
```

```text
bash: data/reads.fastq: Permission denied
```

```bash
chmod u+w data/reads.fastq
```

最后一条命令把写权限还给你。本教程后面还需要它。

### 7.4 关于 `sudo`

`sudo` 以管理员身份运行一条命令。在你自己的电脑上，安装系统软件需要它。在大多数共享服务器上你没有它，日常工作也不需要它。

> **小心。** 不要用 `chmod 777`。它让所有人都有写权限。如果一条命令提示 `Permission denied`，先找原因。常常是别人拥有这个文件，而且是故意设置的。修改共享数据之前，先问文件的所有者。

---

<a id="z8"></a>

## 8. 安装软件，配置环境

### 8.1 命令放在哪里？

当你输入 `samtools`，Shell 会到一个目录列表里查找。这个列表存在变量 `PATH` 里。在你自己的 `~/bin` 目录里做一个小程序，再把 `~/bin` 加进 `PATH`：

```bash
mkdir -p ~/bin
cat > ~/bin/hi <<'EOF'
#!/usr/bin/env bash
echo "hi from ~/bin"
EOF
chmod +x ~/bin/hi
hi
```

```text
bash: hi: command not found
```

Shell 现在还不认识 `~/bin`。把它加进这个终端的 `PATH`：

```bash
export PATH="$HOME/bin:$PATH"
hi
which hi
```

```text
hi from ~/bin
/home/alice/bin/hi
```

关闭终端后，这个改动会消失。要保留它，把 `export` 这一行加到文件 `~/.bashrc` 里（macOS 上的 zsh 用 `~/.zshrc`）：

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
tail -n 1 ~/.bashrc
```

```text
export PATH="$HOME/bin:$PATH"
```

然后运行 `source ~/.bashrc`，或者打开一个新终端。

### 8.2 系统软件包

在 Ubuntu 上，`apt` 为整台电脑安装软件。它需要 `sudo`。

<!-- notest -->
```bash
sudo apt update
sudo apt install -y samtools
```

服务器常常不能访问互联网。如果安装失败，试试镜像。你也可以在自己的电脑上下载文件，再复制到服务器（第 9 章）。

### 8.3 Conda 和 Bioconda

生物信息学工具需要很多其他的库。版本经常冲突。**Conda** 解决这个问题。它给每个项目做一个独立的*环境*。**Bioconda** 是 conda 上的一大批生物信息学工具。

安装 Miniforge。它默认使用 `conda-forge` 渠道。

<!-- notest -->
```bash
curl -L -O "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
bash Miniforge3-$(uname)-$(uname -m).sh
```

关闭终端再重新打开。然后为一个项目建立环境：

<!-- notest -->
```bash
conda create -n qc -c conda-forge -c bioconda seqtk samtools   # 创建环境
conda activate qc                                              # 进入环境
seqtk                                                          # 现在这个工具可以用了
conda deactivate                                               # 离开环境
```

`-c` 选项的顺序决定优先级：先 `conda-forge`，后 `bioconda`。我们用 `micromamba` 测试了这条命令行，它的选项和 conda 相同。

保存环境，让别人能建出同样的环境：

<!-- notest -->
```bash
conda env export --from-history > environment.yml
conda env create -f environment.yml
```

> **经验谈：能省几个小时的规则。** 其中有几条，在知乎上关于 Bioconda 的教程里也出现过。
>
> 1. **不要把工具装进 `base` 环境。** 每个项目或每个工具建一个环境。这样一个冲突不会毁掉所有东西。
> 2. **记下版本。** 最新版不一定最好。论文要用同样的版本才能得到同样的结果。
> 3. **不要混用安装方式。** 除非必须，不要在 conda 环境里用 `pip` 或 `install.packages`。
> 4. **网络慢就用镜像。** 中国的大学常常提供 conda 镜像。镜像地址会变，所以请阅读镜像站的页面。
> 5. **旧教程可能是错的。** Conda 和 Bioconda 的建议会随时间变化。请查看 Bioconda 网站。

### 8.4 容器

容器把一个程序和它所有的库放进一个包里。在你自己的电脑上可以用 Docker。很多集群不允许用 Docker，因为它需要管理员权限。这些集群改为提供 **Apptainer**（旧名 Singularity）。

---

<a id="z9"></a>

## 9. 在远程服务器上工作

### 9.1 用 `ssh` 连接

<!-- notest -->
```bash
ssh alice@server.example.org
```

第一次连接时，`ssh` 会问你是否信任这台服务器。输入 `yes`。然后输入密码。输入 `exit` 离开服务器。

用一对密钥登录，比用密码更安全，也省得每次输入密码。在你自己的电脑上生成一对密钥。目录 `~/.ssh` 必须是私有的（`700`），否则 `ssh` 会拒绝使用你的密钥：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -q -t ed25519 -C "alice@laptop" -f ~/.ssh/id_ed25519 -N ""
ls ~/.ssh
```

```text
id_ed25519  id_ed25519.pub
```

选项 `-N ""` 设置空的口令（passphrase）。我们用它只是为了让演示不用回答问题。真正的密钥，请去掉 `-N ""`，在 `ssh-keygen` 询问时输入口令。如果文件 `~/.ssh/id_ed25519` 已经存在，不要覆盖它。用 `-f` 选择另一个名字。

文件 `id_ed25519` 是你的**私钥**。永远不要把它发给任何人。文件 `id_ed25519.pub` 是**公钥**。把公钥复制到服务器：

<!-- notest -->
```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub alice@server.example.org
```

给服务器起一个短名字。把下面的内容放进文件 `~/.ssh/config`：

```
Host lab
    HostName server.example.org
    User alice
    ServerAliveInterval 60
```

现在输入 `ssh lab` 就够了。`ServerAliveInterval 60` 每 60 秒发送一个小信号，有助于保持空闲的连接不断。

### 9.2 复制文件

| 命令 | 用途 |
|---|---|
| `scp file lab:dir/` | 把一个文件复制到服务器。 |
| `scp lab:dir/file .` | 把服务器上的一个文件复制到当前目录。 |
| `rsync -avhP src/ lab:dir/` | 复制一个目录。只复制有变化的部分。中断后可以继续。 |

<!-- notest -->
```bash
scp data/reads.fastq lab:/home/alice/linux-lab/data/
rsync -avhP data/ lab:/home/alice/linux-lab/data/
```

`rsync` 不会复制没有变化的文件。中断之后你可以再运行一次，它会接着做。下面的演示用两个本地目录来展示这一点：

<!-- nocompare -->
```bash
rsync -avh data/ results/data_copy/ | tail -n 3
rsync -avh data/ results/data_copy/ | tail -n 3
```

```text
sent 1.78K bytes  received 76 bytes  3.72K bytes/sec
total size is 1.53K  speedup is 0.83
sent 113 bytes  received 12 bytes  250.00 bytes/sec
total size is 1.53K  speedup is 12.27
```

你的数字会不同。第二次运行只发送很少的字节，因为什么都没变。

> **小心：路径末尾的斜杠很重要。** `rsync -a src/ dst/` 把 `src` 的*内容*复制到 `dst` 里。`rsync -a src dst/` 会新建一个目录 `dst/src`。很多人都犯过一次这个错误。

大文件复制完以后，比较校验和。校验和是一小段代码，它取决于文件内容：

```bash
cd data
sha256sum genes.tsv ref.fa > ../results/checksums.txt
sha256sum -c ../results/checksums.txt
cd ..
```

```text
genes.tsv: OK
ref.fa: OK
```

在 macOS 上用 `shasum -a 256` 代替 `sha256sum`。

> **经验谈：很多服务器不能访问互联网。**
>
> 在你自己的电脑上，或者在一台网关机器上下载数据。然后用 `scp` 或 `rsync` 复制过去。软件包也可以用同样的办法。

### 9.3 断开连接后让任务继续运行

连接中断时，服务器会给你的 Shell 发一个挂断信号（SIGHUP）。Shell 随即停止它启动的所有程序。一个 10 小时的比对任务可能就这样死掉。

有两个工具可以防止这种情况。

**`tmux`** 在服务器上保留一个终端会话。你可以离开，也可以回来。

<!-- notest -->
```bash
tmux new -s align        # 新建名为 "align" 的会话
# ... 在这里运行你的长命令 ...
# 先按 Ctrl+b，再按 d，脱离会话
tmux ls                  # 列出会话
tmux attach -t align     # 回到会话
```

**`nohup`** 启动一条忽略挂断信号的命令。把输出送进日志文件：

```bash
cat > scripts/slow.sh <<'EOF'
#!/usr/bin/env bash
for i in 1 2 3; do
  echo "step $i"
  sleep 1
done
echo "done"
EOF
chmod +x scripts/slow.sh
nohup ./scripts/slow.sh > results/slow.log 2>&1 &
```

<!-- nocompare -->
```text
[1] 12345
```

结尾的 `&` 让命令在后台运行。Shell 会打印任务编号和进程号（PID）。你的数字会不同。即使你关闭终端，命令也会继续运行。看一看日志：

<!-- nocompare -->
```bash
sleep 4
cat results/slow.log
```

```text
step 1
step 2
step 3
done
```

| | `tmux` | `nohup` |
|---|---|---|
| 回来后能看到屏幕 | 能 | 不能（读日志） |
| 适合 | 你想盯着看的任务 | 启动后就不管的简单任务 |
| 服务器重启后还在 | 不在 | 不在 |

> **经验谈。** 知乎上有几篇教程给出这样的建议：想盯着看、想随时修改的任务用 `tmux`。简单任务用 `nohup`。两种情况都要把输出存进日志文件。没有日志，你就没办法查出任务为什么失败。

其他有用的任务命令：

| 命令 | 动作 |
|---|---|
| `jobs` | 列出这个终端里的任务。 |
| `Ctrl+Z`，然后 `bg` | 暂停正在运行的命令，然后让它在后台继续。 |
| `fg` | 把后台任务调到前台。 |
| `ps -u $USER` | 列出你的进程。 |
| `kill PID` | 请求一个进程停止。PID 从 `ps` 得到。 |
| `kill -9 PID` | 强制进程停止。把它作为最后的选择。 |
| `Ctrl+C` | 停止前台的命令。 |

### 9.4 作业调度器（Slurm）

集群有一个**登录节点**和很多**计算节点**。登录节点用来编辑文件和提交任务。**不要在登录节点上运行重任务。**所有用户共享它。用调度器把重任务送到计算节点。Slurm 是一种常见的调度器。

写一个作业脚本。以 `#SBATCH` 开头的行是设置：

<!-- notest -->
```bash
#!/usr/bin/env bash
#SBATCH --job-name=map
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=04:00:00
#SBATCH --output=%x_%j.log

set -euo pipefail
bwa mem -t "$SLURM_CPUS_PER_TASK" ref.fa reads.fastq | samtools sort -o sorted.bam -
```

<!-- notest -->
```bash
sbatch job.sh          # 提交任务
squeue -u $USER        # 查看你的任务
scancel 123456         # 取消编号为 123456 的任务
sacct -j 123456        # 任务结束后查看结果
```

> **小心。** 分区名、内存限制和时间限制，在不同集群上都不一样。请阅读你所在机构的指南。如果你不知道限制，在启动大任务之前先问。

### 9.5 检查电脑状态

| 命令 | 显示什么 |
|---|---|
| `nproc` | CPU 核心数。 |
| `free -h` | 内存使用情况。 |
| `df -h .` | 磁盘剩余空间。 |
| `du -sh * \| sort -h` | 这里每一项的大小，从小到大。 |
| `top`（或 `htop`） | 正在运行的进程。按 `q` 退出。 |
| `uptime` | 电脑的负载。 |

启动任务之前先检查负载。没有许可，不要用光共享电脑的所有核心。

---

<a id="z10"></a>

## 10. 写一个 Shell 脚本

脚本是一个装着命令的文本文件。你可以反复运行它。它也记录了你做过什么。

### 10.1 开头的几行

<!-- notest -->
```bash
#!/usr/bin/env bash
set -euo pipefail
```

- 第一行叫 *shebang*。它告诉系统使用 bash。
- `set -e` 在某条命令失败时停止脚本。
- `set -u` 在你使用没有设置的变量时停止脚本。
- `set -o pipefail` 让管道中任何一个命令失败时，整个管道就算失败。

### 10.2 一个统计 reads 数的脚本

这个脚本接收一个或多个 FASTQ 文件作为参数。它打印每个文件的 reads 数。它也能读 `.gz` 文件。

```bash
cat > scripts/count_reads.sh <<'EOF'
#!/usr/bin/env bash
# Count reads in FASTQ files (plain or .gz).
# Usage: scripts/count_reads.sh file1.fastq [file2.fastq.gz ...]
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 file1.fastq [file2.fastq.gz ...]" >&2
  exit 1
fi

for fq in "$@"; do
  case "$fq" in
    *.gz) lines=$(gzip -dc "$fq" | wc -l) ;;
    *)    lines=$(wc -l < "$fq") ;;
  esac
  printf '%s\t%d\n' "$(basename "$fq")" "$((lines / 4))"
done
EOF
chmod +x scripts/count_reads.sh
./scripts/count_reads.sh data/reads.fastq results/reads.fastq.gz
```

```text
reads.fastq	10
reads.fastq.gz	10
```

逐行读这个脚本：

| 部分 | 含义 |
|---|---|
| `$#` | 参数的个数。 |
| `$0` | 脚本的名字。 |
| `"$@"` | 所有参数，每个参数保持为一个整体。 |
| `for fq in ...; do ... done` | 对每个文件重复这些命令。 |
| `case ... esac` | 按文件名选择。`*.gz` 匹配以 `.gz` 结尾的名字。 |
| `>&2` | 把信息送到错误流。 |
| `exit 1` | 带着错误码停止。 |

不带参数调用脚本，看用法提示：

```bash
./scripts/count_reads.sh
echo "exit code: $?"
```

```text
Usage: ./scripts/count_reads.sh file1.fastq [file2.fastq.gz ...]
exit code: 1
```

> **小心：从 Windows 来的脚本，行尾可能是错的。**
>
> Windows 用两个字符（CR 和 LF）结束每一行。Linux 只用 LF。带 CR 的脚本会报类似 `env: 'bash\r': No such file or directory` 的错误。用 `tr -d '\r' < old.sh > new.sh` 修复。大多数编辑器都有行尾设置。请选择“LF”。

### 10.3 下一步

- 用 `shellcheck`（`sudo apt install shellcheck`）查找脚本里的错误。
- 把每一步的命令放进各自独立的脚本。每个脚本都先用小的输入测试。
- 当样本很多、步骤很多时，请使用工作流管理器。**Snakemake** 和 **Nextflow** 是两种常见的选择。先学会 Shell 脚本。学完之后，工作流管理器会更容易理解。

> **经验谈。** 脚本是一份计算机能读懂的待办清单。三个月后，你不会记得今天输入过什么。脚本会记得。

---

<a id="z11"></a>

## 11. 小项目：检查 reads 质量并比对

你现在已经学得够多，可以做一个小而真实的分析了。步骤和真实项目一样：

1. 给 reads 做一张质量表。
2. 去掉差的 reads。
3. 把好的 reads 比对到参考序列。
4. 读结果。

### 11.1 做质量表

下面的脚本为每条 read 打印它的长度、GC 含量和平均质量。`awk` 程序先建一张表，把每个质量字符变成它的 Q 分数。

```bash
cat > scripts/fastq_qc.sh <<'EOF'
#!/usr/bin/env bash
# Print a small QC table for one FASTQ file.
# Usage: scripts/fastq_qc.sh data/reads.fastq
set -euo pipefail

fastq="$1"

printf 'read\tlength\tGC_percent\tmean_quality\n'
awk '
  BEGIN { for (i = 33; i < 127; i++) ord[sprintf("%c", i)] = i - 33 }
  NR % 4 == 1 { id = substr($1, 2) }
  NR % 4 == 2 { len = length($0); s = $0; gc = gsub(/[GCgc]/, "", s) }
  NR % 4 == 0 {
    q = 0
    for (i = 1; i <= length($0); i++) q += ord[substr($0, i, 1)]
    printf "%s\t%d\t%.1f\t%.1f\n", id, len, 100 * gc / len, q / length($0)
  }
' "$fastq"
EOF
chmod +x scripts/fastq_qc.sh
./scripts/fastq_qc.sh data/reads.fastq | column -t
```

```text
read    length  GC_percent  mean_quality
read01  36      38.9        40.0
read02  36      50.0        38.3
read03  36      38.9        39.4
read04  36      41.7        30.0
read05  36      61.1        33.9
read06  36      47.2        40.0
read07  36      52.8        12.2
read08  36      8.3         20.0
read09  22      31.8        40.0
read10  36      66.7        30.0
```

有两条 read 看起来不好。`read07` 的平均质量低（12.2），还有三个 `N` 碱基。`read09` 很短（22 个碱基）。`read08` 的 GC 含量只有 8.3%。请留意 `read08`。

### 11.2 去掉差的 reads

保留长度至少 30 且平均质量至少 20 的 reads。保存它们的 ID，再用 `seqtk` 把这些 reads 从文件里取出来：

```bash
./scripts/fastq_qc.sh data/reads.fastq \
  | awk -F'\t' 'NR>1 && $2>=30 && $4>=20 {print $1}' > results/keep_ids.txt
wc -l < results/keep_ids.txt
seqtk subseq data/reads.fastq results/keep_ids.txt > results/clean.fastq
grep -c '^@read' results/clean.fastq
```

```text
8
8
```

剩下 8 条 reads。`read07` 和 `read09` 不在了。

### 11.3 比对 reads

下一个脚本对参考序列建索引，用 `bwa mem` 比对 reads，用 `samtools` 排序并索引结果，然后写出统计信息。日志文件记录每一步。

```bash
cat > scripts/map_reads.sh <<'EOF'
#!/usr/bin/env bash
# Map reads to a reference and write basic statistics.
# Usage: scripts/map_reads.sh ref.fa reads.fastq outdir
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 ref.fa reads.fastq outdir" >&2
  exit 1
fi

ref="$1"
reads="$2"
outdir="$3"
sample=$(basename "$reads" .fastq)

mkdir -p "$outdir"
log="$outdir/$sample.log"

echo "[$(date '+%F %T')] start $sample" | tee "$log"

bwa index "$ref" 2>> "$log"
bwa mem -t 2 "$ref" "$reads" 2>> "$log" \
  | samtools sort -o "$outdir/$sample.sorted.bam" -
samtools index "$outdir/$sample.sorted.bam"
samtools flagstat "$outdir/$sample.sorted.bam" > "$outdir/$sample.flagstat.txt"

echo "[$(date '+%F %T')] done $sample" | tee -a "$log"
EOF
chmod +x scripts/map_reads.sh
```

<!-- nocompare -->
```bash
./scripts/map_reads.sh data/ref.fa results/clean.fastq results/map
```

```text
[2026-10-12 14:06:59] start clean
[2026-10-12 14:06:59] done clean
```

行末的 `\` 表示“命令在下一行继续”。

### 11.4 读结果

```bash
head -n 7 results/map/clean.flagstat.txt
```

```text
8 + 0 in total (QC-passed reads + QC-failed reads)
8 + 0 primary
0 + 0 secondary
0 + 0 supplementary
0 + 0 duplicates
0 + 0 primary duplicates
7 + 0 mapped (87.50% : N/A)
```

8 条 reads 里有 7 条比对上了。再看每条 read 去了哪里。SAM 格式的前六列是：

| 列 | 含义 |
|---|---|
| 1 | Read 名字 |
| 2 | Flag（`0` 正链，`16` 反链，`4` 未比对上） |
| 3 | 参考序列名字 |
| 4 | 第一个碱基的位置（从 1 开始数） |
| 5 | 比对质量 |
| 6 | CIGAR 字符串（`36M` 表示 36 个碱基对上了） |

打印这些列：

```bash
samtools view results/map/clean.sorted.bam | cut -f 1-6
```

```text
read01	0	demo_ref	1	60	36M
read02	0	demo_ref	31	60	36M
read03	0	demo_ref	71	60	36M
read04	16	demo_ref	111	60	36M
read05	0	demo_ref	151	60	36M
read10	0	demo_ref	171	60	36M
read06	0	demo_ref	201	60	36M
read08	4	*	0	0	*
```

我们把 `read04` 做成了反向互补序列，`bwa` 找到了它。它的 flag 是 `16`。`read03` 有一个错误碱基，但它仍然显示 `36M`，因为错配不是缺口。

最后一行是没有比对上的 read。它的 flag 是 `4`，位置是 `0`。数一数没比对上的 reads，并列出它们：

```bash
samtools view -c -f 4 results/map/clean.sorted.bam
samtools view -f 4 results/map/clean.sorted.bam | cut -f 1,2
```

```text
1
read08	4
```

`read08` 就是那条 poly-A 的 read。它的平均质量是 20，所以通过了质量过滤。但它不来自参考序列。

> **经验谈。** 质量分数高，不能证明一条 read 是真的。质量过滤和比对回答的是不同的问题。在真实项目里，FastQC、fastp 和 MultiQC 这样的工具替你完成这里手工做的事。现在你知道它们里面做了什么。

---

<a id="z12"></a>

## 12. 出错了怎么办

你不是第一个看到这个错误的人。从头读错误信息。它常常会告诉你文件名、行号和原因。

| 信息 | 可能的原因 | 怎么办 |
|---|---|---|
| `command not found` | 程序没装，名字写错，或者不在 `PATH` 里。 | 检查拼写。运行 `which name`。激活正确的 conda 环境。 |
| `No such file or directory` | 路径错了，或者当前目录不对。 | 运行 `pwd` 和 `ls`。用 Tab 补全名字。 |
| `Permission denied` | 你无权读、写或运行它。 | 运行 `ls -l`。脚本用 `chmod +x`。共享文件请问所有者。 |
| `env: 'bash\r': No such file...` | 脚本是 Windows 行尾。 | `tr -d '\r' < old.sh > new.sh` |
| `unbound variable` | `set -u` 发现了没设置的变量。 | 检查变量名的拼写。 |
| 写了 `a = 1` 后出现 `a: command not found` | `=` 两边有空格。 | 写成 `a=1`。 |
| `No space left on device` | 磁盘满了。 | `df -h`，然后 `du -sh * \| sort -h`。删除你不再需要的文件。 |
| `Disk quota exceeded` | 你用完了分配的空间。 | 同上。请管理员给你更多空间。 |
| `Killed` | 系统停止了你的程序，常常因为它用了太多内存。 | 申请更多内存。用更少的数据。 |
| `Argument list too long` | 一个 `*` 匹配了太多文件。 | 用 `find ... -print0 \| xargs -0 ...`。 |
| `Connection timed out` | 网络或服务器有问题。 | 检查你的网络和 VPN。用 `ssh -v` 看详细信息。 |

两个你可以试一试的例子：

```bash
printf '#!/usr/bin/env bash\r\necho hi\r\n' > scripts/crlf.sh
chmod +x scripts/crlf.sh
./scripts/crlf.sh 2>&1 | head -n 1
file scripts/crlf.sh
```

你的第一行可能用别的词或别的引号。请在其中找 `bash\r`。`file` 命令也会显示 `CRLF line terminators`。

<!-- nocompare -->
```text
/usr/bin/env: 'bash\r': No such file or directory
scripts/crlf.sh: Bourne-Again shell script, ASCII text executable, with CRLF line terminators
```

```bash
tr -d '\r' < scripts/crlf.sh > scripts/crlf_fixed.sh
chmod +x scripts/crlf_fixed.sh
./scripts/crlf_fixed.sh
```

```text
hi
```

**怎么求助。** 把这四样东西发给同事或论坛：

1. 你输入的完整命令。
2. 完整的错误信息（复制粘贴，不要拍照）。
3. 你期望发生什么。
4. 你已经试过什么。

---

<a id="z13"></a>

## 13. 安全习惯

- [ ] 原始数据放在一个目录里。去掉写权限（`chmod a-w`）。永远不要编辑原始数据。
- [ ] 结果写到和输入不同的目录。
- [ ] 把每条重要的命令写进脚本。保留这些脚本。
- [ ] `rm` 之前先运行 `ls`。用到 `*` 时，用 `echo` 做演习。
- [ ] 绝不要在同一条命令里写入你正在读的文件。
- [ ] 大任务之前检查剩余磁盘空间（`df -h`）。
- [ ] 每个脚本先用小的输入测试。
- [ ] 保存每个长任务的日志。
- [ ] 记录每个工具的版本（`samtools --version`、`conda list`）。
- [ ] 把重要文件备份到第二个地方。检查你能打开备份。

---

<a id="z14"></a>

## 14. 速查表

| 任务 | 命令 |
|---|---|
| 我在哪里？ | `pwd` |
| 列出文件 | `ls -lh` |
| 进入目录 | `cd DIR`、`cd ~`、`cd ..`、`cd -` |
| 新建目录 | `mkdir -p a/b` |
| 复制、移动、删除 | `cp -r`、`mv`、`rm` |
| 显示文件 | `head -n 5 f`、`tail -n 5 f`、`less f` |
| 数行数 | `wc -l f` |
| 读 `.gz` 文件 | `gzip -dc f.gz \| head` |
| 搜索文字 | `grep -n 'text' f` |
| 选择列 | `cut -f 1,3 f` 或 `awk -F'\t' '{print $1,$3}' f` |
| 统计值 | `sort \| uniq -c \| sort -k1,1nr` |
| 替换文字 | `sed 's/old/new/g' f` |
| 查找文件 | `find . -name "*.bam"` |
| 压缩 | `tar -czvf a.tar.gz dir/` |
| 解压 | `tar -xzvf a.tar.gz` |
| 下载 | `curl -L -O URL` 或 `wget URL` |
| 校验和 | `sha256sum f` |
| 权限 | `chmod +x f`、`chmod 644 f` |
| 磁盘空间 | `df -h .`、`du -sh *` |
| 内存、CPU | `free -h`、`nproc`、`top` |
| 停止命令 | `Ctrl+C` |
| 让任务保持运行 | `tmux new -s name`、`nohup cmd > log 2>&1 &` |
| 复制到服务器 | `rsync -avhP src/ lab:dir/` |
| 帮助 | `man cmd`、`cmd --help` |

**键盘快捷键。**

| 按键 | 动作 |
|---|---|
| Tab | 补全名字。 |
| Ctrl+C | 停止正在运行的命令。 |
| Ctrl+R | 搜索命令历史。 |
| Ctrl+A / Ctrl+E | 跳到行首 / 行尾。 |
| Ctrl+L | 清屏。 |
| Ctrl+D | 退出 Shell，或结束输入。 |
| 上方向键 | 上一条命令。 |
| `!!` | 重复上一条命令。 |

---

<a id="z15"></a>

## 15. 继续学习

**免费课程和书**

- [The Unix Shell (Software Carpentry)](https://swcarpentry.github.io/shell-novice/)：温和的课程，带练习。
- [The Missing Semester of Your CS Education (MIT)](https://missing.csail.mit.edu/)：Shell、脚本、Vim、Git。
- [Rosalind](https://rosalind.info/)：用代码解决的生物信息学问题。
- [Bioconda](https://bioconda.github.io/)：怎样用 conda 安装生物信息学工具。
- [Slurm quick start](https://slurm.schedmd.com/quickstart.html)：作业调度的官方指南。
- [Snakemake](https://snakemake.readthedocs.io/) 和 [Nextflow](https://www.nextflow.io/)：工作流管理器。
- [tldr](https://tldr.sh/)：常用命令的简短例子。
- *Bioinformatics Data Skills*，Vince Buffalo 著（O'Reilly）：下一步可读的书。
- Biostars（biostars.org）：生物信息学问答网站。
- *The Linux Command Line*，William Shotts 著：免费的书（linuxcommand.org）。
- 《鸟哥的 Linux 私房菜》：中文的 Linux 经典入门书。当工具书查就行，不必从头读到尾。

**知乎上的中文阅读。** 这些页面讨论的话题，和本教程的经验谈相同。我们没有复制它们的文字。想了解更多细节，请阅读：

- [生物信息学100个基础问题 —— 番外1： 不学Linux做什么生信？](https://zhuanlan.zhihu.com/p/34935771)
- [生信自学之linux操作基础](https://zhuanlan.zhihu.com/p/24863136)
- [如何让任务永不掉线：tmux](https://zhuanlan.zhihu.com/p/426157381)
- [Tmux 一款好用终端复用器（代替nohup！）](https://zhuanlan.zhihu.com/p/667515002)
- [【精】Bioconda 生信环境配置生存指南](https://zhuanlan.zhihu.com/p/46029431)
- [一文掌握Conda软件安装：虚拟环境、软件通道、加速solving、跨服务器迁移](https://zhuanlan.zhihu.com/p/462158923)
- [不小心敲了 rm -rf / 后反应是怎样的？](https://www.zhihu.com/question/29438735)

**关于写作风格。** ASD-STE100 的规则在 [asd-ste100.org](https://asd-ste100.org/)。

---

[↑ 回到顶部](#zh) · [Jump to English ↑](#en)
